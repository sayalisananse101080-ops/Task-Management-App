import React, { useState } from "react";
import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { signupUser } from "../api/authApi";
import type { NativeStackScreenProps } from
    '@react-navigation/native-stack';
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<
    RootStackParamList,
    'Signup'
>;


const initialForm = {
    name: "",
    username: "",
    email: "",
    password: "",
    street: "",
    suite: "",
    city: "",

    zipcode: "",
    lat: "",
    lng: "",
    phone: "",
    website: "",
    company_name: "",
    catchPhrase: "",
    bs: "",
};

type SignupForm = typeof initialForm;

const fields: { key: keyof SignupForm; label: string }[] = [
    { key: "name", label: "NAME" },
    { key: "username", label: "USERNAME" },
    { key: "email", label: "EMAIL" },
    { key: "password", label: "PASSWORD" },
    { key: "street", label: "STREET" },
    { key: "suite", label: "SUITE" },
    { key: "city", label: "CITY" },
    { key: "zipcode", label: "ZIPCODE" },
    { key: "lat", label: "lat" },
    { key: "lng", label: "lng" },
    { key: "phone", label: "PHONE" },
    { key: "website", label: "WEBSITE" },
    { key: "company_name", label: "COMPANY NAME" },
    { key: "catchPhrase", label: "CATCHPHRASE" },
    { key: "bs", label: "BS" },
];

const SignupScreen = ({ navigation }: Props) => {
    const [form, setForm] = useState<SignupForm>(initialForm);
    const [errors, setErrors] = useState<
        Partial<Record<keyof SignupForm, string>>
    >({});

    const [loading, setLoading] = useState(false);

    // Handle input changes
    const handleChange = (field: keyof SignupForm, value: string) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));

        // Remove error when user starts typing
        setErrors((previous) => ({
            ...previous,
            [field]: undefined,
        }));
    };

    const validateForm = () => {
        const newErrors: Partial<
            Record<keyof SignupForm, string>
        > = {};

        (Object.keys(form) as (keyof SignupForm)[]).forEach((field) => {
            if (!form[field].trim()) {
                newErrors[field] = `Please enter ${field.replace(/_/g, " ")}`;
            }
        });

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (
            form.password &&
            !passwordRegex.test(form.password)
        ) {
            newErrors.password =
                'Password must contain 8 characters, uppercase, lowercase, number and special character';
        }
        if (form.email.trim() && !emailRegex.test(form.email.trim())) {
            newErrors.email = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Signup API function
    const handleSignup = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const response = await signupUser(form);

            Alert.alert(
                "Success",
                "Your account has been created successfully!",

                [
                    {
                        text: "Login Now",
                        onPress: () => navigation.replace("Login"),
                    },
                ]
            );
            console.log("Signup response:", response);

        } catch (error: any) {
            console.log("SIGNUP ERROR:", error);

            Alert.alert(
                "Signup Failed",
                error.message || "Something went wrong"
            );
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.heading}>Create Account</Text>

                <Text style={styles.subtitle}>
                    Signup to continue
                </Text>

                {/* All Signup Fields */}

                {fields.map((field) => (
                    <View key={field.key} style={styles.fieldContainer}>
                        <TextInput
                            style={[
                                styles.input,
                                errors[field.key] ? styles.inputError : null,
                            ]}
                            placeholder={field.label}
                            placeholderTextColor="#999999"
                            value={form[field.key]}
                            onChangeText={(text) =>
                                handleChange(field.key, text)
                            }
                            secureTextEntry={field.key === "password"}
                            keyboardType={
                                field.key === "email"
                                    ? "email-address"
                                    : field.key === "phone"
                                        ? "phone-pad"
                                        : "default"
                            }
                            autoCapitalize={
                                field.key === "email" ||
                                    field.key === "website"
                                    ? "none"
                                    : "sentences"
                            }
                        />

                        {errors[field.key] && (
                            <Text style={styles.errorText}>
                                {errors[field.key]}
                            </Text>
                        )}
                    </View>
                ))}

                {/* Signup Button */}

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Please Wait..." : "Sign Up"}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flexGrow: 1,
        paddingTop: 50,
        paddingBottom: 40,
        backgroundColor: "#ffffff",
    },

    heading: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000000",
    },

    subtitle: {
        fontSize: 15,
        color: "#666666",
        marginBottom: 25,
    },

    fieldContainer: {
        marginBottom: 14,
    },

    input: {
        height: 55,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#CCCCCC",
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: 13,
        fontSize: 16,
    },

    inputError: {
        borderColor: "red",
    },

    errorText: {
        color: "red",
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
    },

    button: {
        backgroundColor: "#055bfb",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30,
    },

    buttonText: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "bold",
    },
});

export default SignupScreen;