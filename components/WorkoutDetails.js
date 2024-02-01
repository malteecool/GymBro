import { useEffect } from "react";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Button } from "react-native-elements";
import { Card } from "react-native-elements";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import emitter from "./customEventEmitter";
import { removeWorkoutExercise as removeWorkoutExerciseService, getFirebaseTimeStamp } from '../services/ExerciseService';
import { getWorkoutExercises, updateWorkout, getFormattedTime, updateWorkoutExerciseOrdinal } from '../services/WorkoutService';
import Styles from "../Styles";

export function WorkoutDetails({ navigation, route }) {

    const [running, setRunning] = useState(false);
    const [isLoading, setLoading] = useState(true);
    const [data, setData] = useState([]);
    const [time, setTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [intervalTime, setIntervalTime] = useState(0);
    const [edit, setEdit] = useState(false);

    const workout = route.params.workout;

    const load = async () => {
        try {
            setLoading(true);
            const documentData = await getWorkoutExercises(workout.id);
            setData(documentData);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);


    const moveExerciseForward = (exerciseIndex) => {
        if (exerciseIndex < data.length - 1) {
            const exerciseList = [...data];
            [exerciseList[exerciseIndex], exerciseList[exerciseIndex + 1]] = [exerciseList[exerciseIndex + 1], exerciseList[exerciseIndex]];
            updateExercisePosition(exerciseList);
            setData(exerciseList);
        }
    }

    const moveExerciseBackwards = (exerciseIndex) => {
        if (exerciseIndex > 0) {
            const exerciseList = [...data];
            [exerciseList[exerciseIndex], exerciseList[exerciseIndex - 1]] = [exerciseList[exerciseIndex - 1], exerciseList[exerciseIndex]];
            updateExercisePosition(exerciseList);
            setData(exerciseList);

        }
    }

    const updateExercisePosition = async (exerciseList) => {
        console.log('Updating exercise position');
        if (exerciseList) {
            exerciseList.forEach((exercise, index) => {
                updateWorkoutExerciseOrdinal(workout.id, exercise.woe_id, index);
            });
        }

    }

    const saveWorkout = async () => {
        try {
            setLoading(true);
            const responseJson = await updateWorkout(workout, time);
            console.log(responseJson);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            setLoading(false);
            emitter.emit('workoutEvent');
            navigation.goBack();
        }
    }

    const removeWorkoutExercise = async (exe_id) => {
        try {
            setLoading(true);
            await removeWorkoutExerciseService(workout.id, exe_id, null);
        }
        catch (error) {
            console.log(error);
        }
        finally {
            load();
        }

    };

    const warnUser = (exercise) => {
        Alert.alert('Remove exercise', 'Are you sure you want to delete exercise ' + exercise.exe_name + '?', [
            {
                text: 'Cancel',
                onPress: () => { return; },
                style: 'cancel',
            },
            { text: 'OK', onPress: () => removeWorkoutExercise(exercise.exe_id) },
        ]);
    }


    useEffect(() => {
        const listener = (data) => {
            load();
        };
        emitter.on('workoutExerciseEvent', listener);

        return () => {
            emitter.off('workoutExerciseEvent', listener);
        }

    }, []);

    useEffect(() => {
        let intervalId;
        if (running) {
            intervalId = setInterval(() => {
                if (startTime != null) {
                    setTime(Math.floor(intervalTime + (new Date().getTime() - startTime.getTime()) / 1000));
                }
            }, 1000);
        }
        navigation.setOptions({
            headerTitle: () => (
                <View style={{ paddingBottom: 8 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', ...Styles.fontColor }}>{workout.wor_name}</Text>
                    <Text style={{ fontSize: 18, color: 'gray' }}>{getFormattedTime(time)}</Text>
                </View>
            ),
        });

        return () => clearInterval(intervalId);
    }, [running, time]);

    const startAndStop = () => {
        if (startTime != null) {
            setStartTime(new Date());
        }
        if (running) {
            setIntervalTime(time);
        }
        setRunning(!running);
    };
    return (
        <View style={{ flex: 1, backgroundColor: '#121111' }}>{isLoading ? (
            <View style={Styles.activityIndicator}>
                <ActivityIndicator />
            </View>
        ) : (
            <View style={{ flex: 1 }}>
                <View>
                    <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 100 }}>{
                        data.map((workout, i) => {
                            var exerciseDate = getFirebaseTimeStamp(workout.exe_date.seconds, workout.exe_date.nanoseconds);
                            return (
                                <TouchableOpacity key={workout.exe_name} onPress={() => { navigation.navigate('exerciseDetailsWorkout', { exercise: workout }) }}>
                                    <Card key={i} containerStyle={Styles.card}>

                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View>
                                                <Text style={Styles.cardTitle}>
                                                    {workout.exe_name}
                                                </Text>
                                                <Text style={{ ...Styles.fontColor, marginLeft: 10 }}>
                                                    <MaterialCommunityIcons name='weight-kilogram' size={16} style={Styles.icon} />{' ' + workout.exe_max_weight + '  '}
                                                    <MaterialCommunityIcons name='calendar-range' size={16} style={Styles.icon} />{' ' + (workout.exe_date !== null ? exerciseDate.toDateString() : 'never')}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'flex-end' }}>{
                                                !edit ? (<TouchableOpacity onPress={() => setEdit(true)} ><MaterialCommunityIcons name='pencil' size={25} style={Styles.icon} /></TouchableOpacity>) :
                                                    (<View style={{ flexDirection: "row" }}>
                                                        <View style={{marginRight: 5}}>
                                                            <TouchableOpacity onPress={() => { moveExerciseBackwards(i) }}><MaterialCommunityIcons name='arrow-up' size={25} style={Styles.icon} /></TouchableOpacity>
                                                            <TouchableOpacity onPress={() => { moveExerciseForward(i) }}><MaterialCommunityIcons name='arrow-down' size={25} style={Styles.icon} /></TouchableOpacity>
                                                        </View>
                                                        <View>
                                                            <TouchableOpacity onPress={() => { warnUser(workout) }}><MaterialCommunityIcons name='trash-can-outline' size={25} style={Styles.icon} /></TouchableOpacity>
                                                            <TouchableOpacity onPress={() => { setEdit(false) }}><MaterialCommunityIcons name='window-close' size={25} style={Styles.icon} /></TouchableOpacity>
                                                        </View>
                                                    </View>
                                                    )
                                            }</View>

                                        </View>
                                    </Card>
                                </TouchableOpacity>)
                        })
                    }
                    </ScrollView>

                </View>
                <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    position: 'absolute',
                    bottom: 45
                }}>
                    <View style={{ flex: 1, margin: 10, marginRight: 2 }}>
                        <Button buttonStyle={Styles.green} title={running ? 'Stop' : 'Start'} onPress={() => { startAndStop() }} />
                    </View>
                    <View style={{ flex: 1, margin: 10, marginLeft: 2 }}>
                        <Button buttonStyle={Styles.green} onPress={() => { navigation.navigate('addExercise', { userId: workout.wor_usr_id, workoutId: workout.id }) }} title='Add exercise' />
                    </View>
                </View>
                <View style={{ position: 'absolute', width: '100%', bottom: 0 }}>
                    <Button disabled={time <= 0} title='Complete' buttonStyle={{ margin: 10, ...Styles.green }} onPress={() => { saveWorkout() }} />
                </View>
            </View >
        )
        }
        </View >
    )

}