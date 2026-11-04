import React, { useState } from "react";
import { View, Alert, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { loginUser } from "../api/authApi";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import AsyncStorage from '@react-native-async-storage/async-storage';
type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const Loginscreen = ({ navigation }: Props) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Email and password are required');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
            return;
        }

        // const passwordRegex =
        //     /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        // if (!passwordRegex.test(password.trim())) {
        //     setError('Please enter a valid password');
        //     return;
        // }
        try {
            setLoading(true);
            const data = await loginUser(email, password);

            console.log('LOGIN DATA:', {
                user_id: data.user_id,
                name: data.name,
                email: data.email,
            });
            if (!data.access_token) {
                throw new Error('Login successful but token was not received');
            }

            await AsyncStorage.setItem('access_token', data.access_token);
            await AsyncStorage.setItem('user_id', String(data.user_id));
            await AsyncStorage.setItem('user_name', data.name);

            navigation.replace('TaskList');

        }
        catch (error: any) {
            console.log('LOGIN SCREEN ERROR:', error);

            Alert.alert(
                'Login Failed',
                error.message || 'Something went wrong',
            );
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Task Management System</Text>
                        <Text style={styles.subtitle}>Task Management System portal</Text>
                    </View>
                    <View style={styles.divide} />
                    <Text style={styles.loginTitle}>Welcome Back</Text>
                    <Text style={styles.loginSubtitle}>Sign in to acess your account</Text>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter yoru Email"
                        onChangeText={(text) => {
                            setEmail(text);
                            setError('');
                        }}
                        value={email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholderTextColor="#b1aaaa"
                    />
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}
                    <Text style={styles.label}>Password:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setError('');
                        }}
                        secureTextEntry
                        placeholderTextColor="#b1aaaa"
                    />
                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Signup")}>
                        <Text style={styles.signupText}>Don't have an account? Sign Up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Please Wait...' : 'LOGIN'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.footerText}>
                        Multiple Task is to here
                    </Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#f1f1f1",
    },
    container: {
        flex: 1,
        padding: 20,
        borderRadius: 18,
        shadowColor: "black",
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        shadowOpacity: 1,
        elevation: 8,
        margin: 2,
        width: "100%",
        maxWidth: 500,
        backgroundColor: "#ffff"
    },
    header: {
        alignItems: "center",
    },
    title: {
        fontWeight: "bold",
        fontSize: 30,
        color: "#4f5964",
        textAlign: "center",
        justifyContent: "center",
    },
    subtitle: {
        marginTop: 5,
        fontSize: 15,
        color: "rgba(6, 48, 110, 0.71)",
        textAlign: "center",
    },
    divide: {
        height: 3,
        backgroundColor: "rgba(87, 87, 98, 0.98)",
        marginVertical: 30,
    },
    loginTitle: {
        fontSize: 25,
        fontWeight: "bold",
        color: "rgba(88, 20, 144, 0.81)",
        marginBottom: 5,
        textAlign: "center"
    },
    loginSubtitle: {
        fontSize: 13,
        color: "grey",
        marginBottom: 20,
        textAlign: "center",
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#454040",
        marginBottom: 7,
        marginTop: 10,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 9,
        borderColor: "black",
        paddingHorizontal: 20,
        backgroundColor: "white",
        color: "#010428ae",
        fontSize: 15,
    },
    button: {
        borderCurve: "circular",
        height: 50,
        marginTop: 25,
        marginBottom: 15,
        borderRadius: 9,
        backgroundColor: "#1846ef",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#382fb4",
        shadowOffset: { width: 0, height: 5, },
        shadowOpacity: 1,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonText: {
        color: "#262323",
        fontSize: 17,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    footerText: {
        fontSize: 12,
        color: "#bbbaba",
        marginTop: 25,
        textAlign: "center",
    },
    errorText: {
        color: "red",
        fontSize: 14,
        marginTop: 6,
    },
    signupText: {
        color: "#1846ef",
        fontSize: 15,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 20,
    },
})
export default Loginscreen;