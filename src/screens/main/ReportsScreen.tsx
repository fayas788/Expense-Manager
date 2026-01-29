import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Paths, File as ExpoFile } from 'expo-file-system';

import { useTransactionStore, useSettingsStore, useUIStore } from '../../stores';
import { formatCurrency } from '../../utils/formatters';

const screenWidth = Dimensions.get('window').width;

export const ReportsScreen: React.FC = () => {
    const { summary, categorySummary, transactions, loadSummary, loadCategorySummary, loadTransactions } = useTransactionStore();
    const { settings } = useSettingsStore();
    const { showAlert } = useUIStore();

    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    useFocusEffect(
        useCallback(() => {
            loadSummary();
            loadCategorySummary();
            loadTransactions();
        }, [])
    );

    const getFilteredTransactions = (type: 'all' | 'borrow' | 'lend' | 'expense') => {
        if (type === 'all') return transactions;
        return transactions.filter(t => t.type === type);
    };

    const handleExport = (format: 'pdf' | 'csv') => {
        showAlert(
            `Export ${format.toUpperCase()}`,
            'Select report type:',
            [
                { text: 'Cancel', style: 'destructive' },
                { text: '💸 Expenses', onPress: () => format === 'pdf' ? generatePDF('expense') : generateCSV('expense') },
                { text: '💵 Lend', onPress: () => format === 'pdf' ? generatePDF('lend') : generateCSV('lend') },
                { text: '↙️ Borrow', onPress: () => format === 'pdf' ? generatePDF('borrow') : generateCSV('borrow') },
                { text: '📋 All', onPress: () => format === 'pdf' ? generatePDF('all') : generateCSV('all') },
            ]
        );
    };

    const generatePDF = async (type: 'all' | 'borrow' | 'lend' | 'expense') => {
        try {
            const data = getFilteredTransactions(type);
            const title = type === 'all' ? 'Transaction Report' : `${type.charAt(0).toUpperCase() + type.slice(1)} Report`;

            // Calculate status counts based on filtered data
            const pendingCount = data.filter(t => t.type !== 'expense' && t.status === 'pending').length;
            const overdueCount = data.filter(t => {
                if (t.type === 'expense' || t.status === 'settled') return false;
                if (!t.dueDate) return false;
                return new Date(t.dueDate) < new Date();
            }).length;

            const html = `
                <html>
                    <head>
                        <style>
                            body { 
                                font-family: 'Helvetica', sans-serif; 
                                padding: 30px; 
                                color: #334155;
                                background: #f8fafc;
                            }
                            .header { 
                                background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
                                color: white;
                                padding: 30px;
                                border-radius: 16px;
                                margin-bottom: 24px;
                            }
                            h1 { margin: 0 0 8px 0; font-size: 28px; }
                            .subtitle { opacity: 0.9; font-size: 14px; }
                            .summary-grid {
                                display: grid;
                                grid-template-columns: repeat(4, 1fr);
                                gap: 16px;
                                margin-bottom: 24px;
                            }
                            .summary-card {
                                background: white;
                                border-radius: 12px;
                                padding: 16px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            .summary-card .label { color: #64748B; font-size: 12px; text-transform: uppercase; }
                            .summary-card .value { font-size: 24px; font-weight: bold; margin-top: 4px; }
                            .summary-card.green .value { color: #22C55E; }
                            .summary-card.red .value { color: #EF4444; }
                            .summary-card.blue .value { color: #3B82F6; }
                            .summary-card.amber .value { color: #F59E0B; }
                            table { 
                                width: 100%; 
                                border-collapse: collapse; 
                                background: white;
                                border-radius: 12px;
                                overflow: hidden;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            }
                            th { 
                                background: #F1F5F9;
                                color: #475569;
                                font-weight: 600;
                                text-transform: uppercase;
                                font-size: 11px;
                                letter-spacing: 0.5px;
                            }
                            th, td { 
                                padding: 12px 16px; 
                                text-align: left; 
                                border-bottom: 1px solid #E2E8F0;
                            }
                            tr:last-child td { border-bottom: none; }
                            .amount { text-align: right; font-weight: 600; }
                            .status-badge {
                                display: inline-block;
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 600;
                            }
                            .status-pending { background: #FEF3C7; color: #D97706; }
                            .status-completed { background: #DCFCE7; color: #16A34A; }
                            .status-overdue { background: #FEE2E2; color: #DC2626; }
                            .type-borrow { color: #EF4444; }
                            .type-lend { color: #22C55E; }
                            .type-expense { color: #3B82F6; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>📊 ${title}</h1>
                            <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>

                        ${type === 'all' ? `
                        <div class="summary-grid">
                            <div class="summary-card green">
                                <div class="label">To Receive</div>
                                <div class="value">${formatCurrency(summary?.totalLent || 0, settings.currencySymbol)}</div>
                            </div>
                            <div class="summary-card red">
                                <div class="label">To Pay</div>
                                <div class="value">${formatCurrency(summary?.totalBorrowed || 0, settings.currencySymbol)}</div>
                            </div>
                            <div class="summary-card blue">
                                <div class="label">Expenses</div>
                                <div class="value">${formatCurrency(summary?.totalExpenses || 0, settings.currencySymbol)}</div>
                            </div>
                            <div class="summary-card amber">
                                <div class="label">Overdue</div>
                                <div class="value">${overdueCount}</div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Person/Category</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.map(t => {
                const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'settled';
                const statusClass = isOverdue ? 'status-overdue' : t.status === 'settled' ? 'status-completed' : 'status-pending';
                const statusText = isOverdue ? 'Overdue' : t.status === 'settled' ? 'Paid' : t.status === 'partial' ? 'Partial' : 'Pending';
                return `
                                    <tr>
                                        <td class="type-${t.type}">${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                                        <td>${new Date(t.date).toLocaleDateString()}</td>
                                        <td>${t.type === 'expense' ? t.category : (t.personName || 'Unknown')}</td>
                                        <td>${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                        <td class="amount">${formatCurrency(t.amount, settings.currencySymbol)}</td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            showAlert('Error', 'Failed to generate PDF report');
        }
    };

    const generateCSV = async (type: 'all' | 'borrow' | 'lend' | 'expense') => {
        try {
            const data = getFilteredTransactions(type);
            const header = 'Date,Type,Category/Person,Amount,Description,Status,Due Date\n';
            const rows = data.map(t =>
                `${t.date},${t.type},"${t.type === 'expense' ? t.category : (t.personName || 'Unknown')}",${t.amount},"${t.description || ''}",${t.status},${t.dueDate || ''}`
            ).join('\n');

            const csv = header + rows;
            const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
            const file = new ExpoFile(Paths.cache, filename);

            file.write(csv);
            await Sharing.shareAsync(file.uri, { UTI: '.csv', mimeType: 'text/csv' });
        } catch (error) {
            console.error(error);
            showAlert('Error', 'Failed to generate CSV report');
        }
    };

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#6366F1'
        }
    };

    const pieData = categorySummary.slice(0, 5).map((cat, index) => ({
        name: cat.categoryName.length > 8 ? cat.categoryName.slice(0, 8) + '...' : cat.categoryName,
        population: cat.total,
        color: cat.categoryColor,
        legendFontColor: '#64748B',
        legendFontSize: 12
    }));

    // Prepare Line Chart Data
    const getChartData = () => {
        const labels: string[] = [];
        const data: number[] = [];
        const now = new Date();
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;

        if (period === 'year') {
            // Monthly data for last 12 months
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(d.toLocaleString('default', { month: 'short' }));

                // Sum expenses for this month
                const monthlyTotal = transactions
                    .filter(t => t.type === 'expense' &&
                        new Date(t.date).getMonth() === d.getMonth() &&
                        new Date(t.date).getFullYear() === d.getFullYear()
                    )
                    .reduce((sum, t) => sum + t.amount, 0);
                data.push(monthlyTotal);
            }
        } else {
            // Daily data for last N days
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                if (period === 'week' || i % 5 === 0) { // Show label every 5 days for month view
                    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
                } else {
                    labels.push(''); // Hide some labels
                }

                // Sum expenses for this day
                const dailyTotal = transactions
                    .filter(t => t.type === 'expense' &&
                        new Date(t.date).toDateString() === d.toDateString()
                    )
                    .reduce((sum, t) => sum + t.amount, 0);
                data.push(dailyTotal);
            }
        }

        return {
            labels,
            datasets: [{ data: data.length ? data : [0] }]
        };
    };

    const lineChartData = getChartData();

    const periods = [
        { label: 'Week', value: 'week' as const },
        { label: 'Month', value: 'month' as const },
        { label: 'Year', value: 'year' as const },
    ];

    return (
        <View className="flex-1 bg-slate-100">
            <StatusBar style="light" />

            {/* Gradient Header */}
            <LinearGradient
                colors={['#4F46E5', '#6366F1', '#818CF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-14 pb-6 px-5"
            >
                <SafeAreaView edges={['top']}>
                    <View className="flex-row justify-between items-center">
                        <View>
                            <Text className="text-3xl font-bold text-white">Reports</Text>
                            <Text className="text-white/70 mt-1">Insights & analytics</Text>
                        </View>
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => handleExport('csv')}
                                className="bg-white/20 px-3 py-2 rounded-xl flex-row items-center"
                            >
                                <Text className="text-white font-medium">📄 CSV</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => handleExport('pdf')}
                                className="bg-white/20 px-3 py-2 rounded-xl flex-row items-center"
                            >
                                <Text className="text-white font-medium">📊 PDF</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView className="flex-1 -mt-4" showsVerticalScrollIndicator={false}>
                {/* Period Selector */}
                <View className="px-5 py-4 pt-6">
                    <View className="flex-row bg-white rounded-2xl p-1.5 shadow-sm">
                        {periods.map((p) => (
                            <TouchableOpacity
                                key={p.value}
                                onPress={() => setPeriod(p.value)}
                                className="flex-1 overflow-hidden rounded-xl"
                            >
                                {period === p.value ? (
                                    <LinearGradient
                                        colors={['#6366F1', '#818CF8']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        className="py-3"
                                    >
                                        <Text className="text-center font-semibold text-white">{p.label}</Text>
                                    </LinearGradient>
                                ) : (
                                    <View className="py-3">
                                        <Text className="text-center font-medium text-slate-500">{p.label}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Summary Cards */}
                <View className="px-5 py-2">
                    <View className="bg-white rounded-2xl p-5 mb-3 shadow-sm" style={{ shadowColor: '#6366F1', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                        <Text className="text-slate-500 text-sm mb-1">Total Expenses</Text>
                        <Text className="text-3xl font-bold text-slate-800">
                            {formatCurrency(summary?.totalExpenses || 0, settings.currencySymbol)}
                        </Text>
                    </View>

                    <View className="flex-row gap-3">
                        <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm">
                            <LinearGradient
                                colors={['#22C55E', '#16A34A']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-1.5"
                            />
                            <View className="p-4">
                                <Text className="text-green-600 text-sm mb-1">To Receive</Text>
                                <Text className="text-xl font-bold text-green-700">
                                    {formatCurrency(summary?.totalLent || 0, settings.currencySymbol)}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm">
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                className="h-1.5"
                            />
                            <View className="p-4">
                                <Text className="text-red-600 text-sm mb-1">To Pay</Text>
                                <Text className="text-xl font-bold text-red-700">
                                    {formatCurrency(summary?.totalBorrowed || 0, settings.currencySymbol)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Expense Trend Chart */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-bold text-slate-800 mb-3">📈 Expense Trend</Text>
                    <View className="bg-white rounded-2xl p-3 items-center shadow-sm" style={{ shadowColor: '#6366F1', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                        <LineChart
                            data={lineChartData}
                            width={screenWidth - 50}
                            height={200}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                                propsForDots: { r: "4", strokeWidth: "2", stroke: "#6366F1" }
                            }}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    </View>
                </View>

                {/* Expense by Category */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-bold text-slate-800 mb-3">📊 By Category</Text>

                    {categorySummary.length > 0 ? (
                        <View className="bg-white rounded-2xl p-4 shadow-sm">
                            <PieChart
                                data={pieData}
                                width={screenWidth - 80}
                                height={180}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="0"
                                absolute
                            />
                        </View>
                    ) : (
                        <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
                            <Text className="text-5xl mb-3">📊</Text>
                            <Text className="text-slate-800 font-semibold text-lg mb-1">No data yet</Text>
                            <Text className="text-slate-500 text-center">Add expenses to see category breakdown</Text>
                        </View>
                    )}
                </View>

                {/* Category Breakdown */}
                <View className="px-5 py-4">
                    <Text className="text-lg font-bold text-slate-800 mb-3">📋 Breakdown</Text>

                    {categorySummary.map((cat) => (
                        <View key={cat.categoryId} className="bg-white rounded-2xl p-4 mb-2 flex-row items-center shadow-sm">
                            <LinearGradient
                                colors={[cat.categoryColor, cat.categoryColor + 'AA']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="w-11 h-11 rounded-xl justify-center items-center mr-3"
                            >
                                <View className="w-3 h-3 rounded-full bg-white" />
                            </LinearGradient>
                            <View className="flex-1">
                                <Text className="text-slate-800 font-semibold">{cat.categoryName}</Text>
                                <View className="flex-row items-center mt-1">
                                    <View className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden mr-2">
                                        <View
                                            className="h-2 rounded-full"
                                            style={{ width: `${cat.percentage}%`, backgroundColor: cat.categoryColor }}
                                        />
                                    </View>
                                    <Text className="text-slate-500 text-xs">{cat.percentage.toFixed(0)}%</Text>
                                </View>
                            </View>
                            <Text className="font-bold text-slate-800 ml-2">
                                {formatCurrency(cat.total, settings.currencySymbol)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View className="h-24" />
            </ScrollView>
        </View>
    );
};

export default ReportsScreen;
