import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useUIStore } from '../../stores/uiStore';

const { width } = Dimensions.get('window');

export const CustomAlert: React.FC = () => {
    const { isVisible, title, message, buttons, hideAlert } = useUIStore();

    if (!isVisible) return null;

    return (
        <Modal transparent visible={isVisible} animationType="none" onRequestClose={hideAlert}>
            <View className="flex-1 bg-black/50 justify-center items-center px-6">
                <Animated.View
                    entering={ZoomIn.duration(200)}
                    className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl"
                >
                    <Text className="text-xl font-bold text-slate-800 mb-2 text-center">{title}</Text>
                    <Text className="text-slate-600 text-base text-center mb-6">{message}</Text>

                    <View className={buttons.length > 2 ? 'flex-col' : 'flex-row'}>
                        {buttons.map((btn, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => {
                                    hideAlert();
                                    if (btn.onPress) btn.onPress();
                                }}
                                style={
                                    buttons.length > 2 && index > 0
                                        ? { marginTop: 12 }
                                        : buttons.length <= 2 && index > 0
                                            ? { marginLeft: 12 }
                                            : undefined
                                }
                                className={`rounded-xl justify-center items-center py-3 bg-indigo-600 ${btn.style === 'destructive' ? 'bg-red-500' :
                                    btn.style === 'cancel' ? 'bg-slate-100' : ''
                                    } ${buttons.length > 2 ? 'w-full' : 'flex-1'}`}
                            >
                                <Text
                                    className={`font-semibold text-center ${btn.style === 'destructive' ? 'text-white' :
                                        btn.style === 'cancel' ? 'text-slate-600' :
                                            'text-white'
                                        }`}
                                >
                                    {btn.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};
