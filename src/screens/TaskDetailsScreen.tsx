import React from "react";
import { Text, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
type Props = NativeStackScreenProps<
    RootStackParamList,
    "TaskDetails"
>;
const TaskDetailsScreen = ({ route, navigation }: Props) => {
    const { task } = route.params;
    const handleComplete = () => {
        Alert.alert(
            "Mark Completed",
            "Do you want to mark this task as completed?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes",
                    onPress: () => {
                        Alert.alert("Next step", "Update API is not connected yet.");
                    },
                },
            ]
        );
    };
    const handleDelete = () => {
        Alert.alert(
            "Delete Task",
            "Are you sure you want to delete this task?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        Alert.alert("Next step", "Delete API is not connected yet.")
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.back}>
                    {"< Back to Tasks"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.heading}>Task Details</Text>
            <View style={styles.card}>
                <Text style={styles.title}>{task.title}</Text>

                <Text style={styles.label}>Task ID</Text>
                <Text style={styles.value}>{task.id}</Text>

                <Text style={styles.label}>User ID</Text>
                <Text style={styles.value}>{task.userId}</Text>

                <Text style={styles.label}>Task Description</Text>
                <Text style={styles.value}>
                    {task.description || `Task Details for: ${task.title}`}
                </Text>

                <Text style={styles.label}>Status</Text>
                <Text
                    style={[
                        styles.status,
                        { color: task.status ? "#15803D" : "#B45309" }
                    ]}>{task.status}
                    {/* {task.status ? "Completed" : "Pending"} */}
                </Text>

                <Text
                    style={styles.label}>Priority</Text>
                <Text style={styles.value}>{task.priority || "Medium"}</Text>
            </View>

            {task.status !== "Completed" && (
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleComplete}>
                    <Text style={styles.buttonText}>Mark as completed</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}>
                <Text style={styles.buttonText}>Delete Task</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F3F6FC",
    },
    back: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 24,
        marginTop:15,
        color: "#2457E6"
    },
    heading: {
        color: "#172B4D",
        fontSize: 23,
        fontWeight: "800",
        marginBottom: 20,
    },
    card: {
        backgroundColor:"#FFFFFF",
        padding: 20,
        borderRadius:18,
        elevation:3,
        marginBottom: 20,
    },
    title: {
        color: "#172B4D",
        fontSize: 23,
        fontWeight: "700",
        marginBottom: 20,
    },
    label: {
        color: "#64748B",
        fontSize: 23,
        marginTop: 12,
    },
    value: {
        fontSize: 12,
        marginTop:4,
        color:"#263449"
    },
    status: {
        fontSize: 23,
        fontWeight: "700",
        marginTop: 12,
    },
    completeButton: {
        backgroundColor: "#15803D",
        padding:16,
        borderRadius:10,
        alignItems:"center",
        marginBottom: 12,
    },
    deleteButton: {
        backgroundColor: "#DC2626",
        padding:16,
        borderRadius:10,
        alignItems:"center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "700",
    },
});
export default TaskDetailsScreen;