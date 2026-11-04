
import React, { useCallback } from "react";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import { getTasks, ApiError } from "../api/taskApi";
import  AsyncStorage  from "@react-native-async-storage/async-storage";
import type { Task } from "../types/task";
type Props = NativeStackScreenProps<
    RootStackParamList,
    "TaskList">
const TaskListScreen = ({ navigation }: Props) => {
    // const [task, setTask] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [task, setTask] = useState<Task[]>([]);
    const [filter, setFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
    // useEffect(() => {
    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await getTasks();
            setTask(data);
        }
        catch (error) {
            console.error('Task loading error:', error)
            // Token expire zala asel tar parat login la pathva
            if (error instanceof ApiError && error.status === 401) {
                await AsyncStorage.multiRemove(['access_token', 'user_id', 'user_name']);
                navigation.replace('Login');
                return;
            }
            setError(
                error instanceof Error ?
                    error.message : String(error)
                    // "Unable to load the the Task. Please Try Again Later"
            );
        }
        finally {
            setLoading(false);
        }
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            loadTasks();
        }, [loadTasks])
    );
    const filteredTasks = task.filter((item) => {
        if (filter === 'All') return true;
        return item.status === filter;
    });
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Loading Task....</Text>
            </View>
        );
    }
    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error}</Text>
                <TouchableOpacity style={styles.addButton} onPress={loadTasks}>
                    <Text style={styles.addButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <Text style={styles.heading}>My Tasks</Text>
                    <Text style={styles.subTitle}>Manage your daily tasks</Text>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate("AddEditTask")}>
                    <Text style={styles.addButtonText}>+ Add Task</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionaTitle}>Your Tasks</Text>
            <View style={styles.filterContainer}>
                {(['All', 'Pending', 'Completed'] as const).map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.filterButton,
                            filter === item && styles.activeFilter,
                        ]}
                        onPress={() => setFilter(item)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                filter === item && styles.activeFilterText,
                            ]}
                        >
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredTasks}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>No tasks found.</Text>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.8}
                        onPress={() =>
                            navigation.navigate("TaskDetails", { task: item })
                        }
                    >
                        <View style={styles.cardHeader}>
                            <Text style={styles.title} numberOfLines={2}>
                                {item.title}
                            </Text>

                            <View
                            
                                style={
                                    styles.statusBadge}>
                                <Text style={styles.statusText}>
                                    {item.status}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.taskId}>
                            Task #{item.id} • User #{item.userId}
                        </Text>

                        <Text style={styles.description}>
                            {item.description || `Task details for: ${item.title}`}
                        </Text>

                        <View style={styles.cardFooter}>
                            <View style={styles.priorityBadge}>
                                <Text style={styles.priorityText}>
                                    ● {item.priority || "Medium"} Priority
                                </Text>
                            </View>

                            <Text style={styles.viewDetails}>
                                View details →
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

        </View>
    )
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 18,
        backgroundColor: "#F3F6FC",
    },
    headerRow: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    headerText: {
        flex: 1,
        marginRight: 8,
    },
    heading: {
        fontSize: 25,
        fontWeight: "bold",
        color: "#172B4D",
        marginBottom: 8,
    },
    subTitle: {
        fontSize: 12,
        color: "#64748B",
        marginTop: 5,
    },
    addButton: {
        backgroundColor: "#1846EF",
        paddingVertical: 13,
        paddingHorizontal: 14,
        borderRadius: 10,
        elevation: 3,
        alignItems: "center",
        marginBottom: 20,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        textAlign: "center",
        justifyContent: "space-between",
        fontWeight: "bold",
    },
    sectionaTitle: {
        fontSize: 23,
        fontWeight: "bold",
        color: "#172B4D",
        marginBottom: 14,
    },
    center: {
        color: "white",
        flex: 1,
        justifyContent: "center",
        padding: 12,
        alignItems: "center",
    },
    error: {
        color: "red",
        textAlign: "center",
        marginBottom: 16,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 25,
        color: "#64748B",
        fontSize: 15,
    },
    card: {
        marginBottom: 16,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        padding: 18,
        borderWidth: 1,
        borderColor: "#E5EAF3",
        elevation: 3,
        shadowColor: "#334155",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
    },

    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: "700",
        color: "#172B4D",
        marginBottom: 10,
    },

    taskId: {
        fontSize: 12,
        color: "#64748B",
        marginBottom: 12,
    },

    description: {
        fontSize: 14,
        lineHeight: 21,
        color: "#64748B",
        marginBottom: 16,
    },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    pendingBadge: {
        backgroundColor: "#FFF1D6",
    },

    completedBadge: {
        backgroundColor: "#DDF7E8",
    },

    statusText: {
        fontSize: 11,
        fontWeight: "700",
    },

    pendingText: {
        color: "#A16207",
    },

    completedText: {
        color: "#15803D",
    },

    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
    },

    priorityBadge: {
        backgroundColor: "#E8EEFF",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
    },

    priorityText: {
        color: "#3156B8",
        fontSize: 12,
        fontWeight: "600",
    },

    viewDetails: {
        color: "#2457E6",
        fontSize: 13,
        fontWeight: "600",
    },
    id: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 1,
    },
    userId: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 6,

    },
    status: {
        fontSize: 13,
        fontWeight: "400",
    },
    priority: {
        fontSize: 13,
        fontWeight: "400",
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    filterButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },

    activeFilter: {
        backgroundColor: '#1846ef',
    },

    filterText: {
        color: '#333333',
        fontWeight: '600',
    },

    activeFilterText: {
        color: '#FFFFFF',
    },
})
export default TaskListScreen;
