import React from "react";
import { View, Text, StyleSheet} from "react-native";
import Loginscreen from './src/screens/LoginScreens';
import TaskListScreen from "./src/screens/TaskListScreens";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import AddEditTaskScreen from "./src/screens/AddEditTaskScreens";
import TaskDetailsScreen from "./src/screens/TaskDetailsScreen";
import type { Task } from "./src/types/task";
import SignupScreen from "./src/screens/SignupScreen";
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  TaskList: undefined;
  AddEditTask: undefined;
  TaskDetails: {task: Task };
};
const Stack =  createNativeStackNavigator<RootStackParamList>();
const App = () =>{
  return(
    <NavigationContainer>
      <Stack.Navigator
      initialRouteName = "Login"
      screenOptions = {{headerShown: false}}>

      <Stack.Screen
      name="Login"
      component={Loginscreen}
      />
      <Stack.Screen
      name="Signup"
      component={SignupScreen}
      />
      <Stack.Screen
      name="TaskList"
      component={TaskListScreen}
      />
      <Stack.Screen
      name="AddEditTask"
      component={AddEditTaskScreen}
      />
      <Stack.Screen
      name="TaskDetails"
      component={TaskDetailsScreen}
      />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default App;
const styles=StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:"#ddd8d8",
    justifyContent:"center",
    padding:10,
  },
})
