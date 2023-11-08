import { Text, View, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card, Button } from 'react-native-elements';
import emitter from './customEventEmitter';
import { getExercises, removeExercise as removeExerciseService, getFirebaseTimeStamp } from '../services/ExerciseService'; 

export function ExcerciseScreen({ navigation, route }) {
    const [isLoading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    const user = route.params.userInfo.user;
    // fetch exercises
    const load = async () => {
        try {
            setLoading(true);
            const exercises = await getExercises(user.usr_token);
            setData(exercises);
        }
        catch (error) {
            console.error(error)
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const removeExercise = async (exe_id) => {
        try {
            await removeExerciseService(exe_id, user.usr_token);
        }
        catch (error) {
            console.error(error)
        }
        finally {
            load();
        }
    };

    React.useEffect(() => {
        const listener = (data) => {
            console.log("event recieved");
            load();
        };
        emitter.on('exerciseEvent', listener);

        return () => {
            emitter.off('exerciseEvent', listener);
        }

    }, []);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {isLoading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator />
                    <Text>Fetching exercises...</Text>
                </View>
            ) : (
                <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 20 }}>{

                    data.map((item, i) => {

                        var ExerciseDate = getFirebaseTimeStamp(item.exe_date.seconds, item.exe_date.nanoseconds);

                        return (
                            <TouchableOpacity key={item.exe_name} onPress={() => { navigation.navigate('exerciseDetails', { exercise: item }) }}>
                                <Card containerStyle={{ borderRadius: 6, borderBottomWidth: 2, borderRightWidth: 2 }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Card.Title>{item.exe_name}</Card.Title>
                                        <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'flex-end' }}>
                                            <TouchableOpacity onPress={() => removeExercise(item.id)} style={{ margin: 0, padding: 3 }}>
                                                <MaterialCommunityIcons name="trash-can-outline" size={16} color='highcontrastdark' />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Card.Divider color='black'></Card.Divider>

                                    <Text><MaterialCommunityIcons name='weight-kilogram' size={16} />{item.exe_max_weight}</Text>

                                    <Text><MaterialCommunityIcons name='calendar-range' size={16} />{item.exe_date !== null ? ExerciseDate.toDateString() : "Never"}</Text>
                                </Card>
                            </TouchableOpacity>
                        )
                    })

                }</ScrollView>
            )}
            <TouchableOpacity style={{
                position: 'absolute',
                bottom: 10,
                right: 10,
            }}>
                <Button onPress={() => { navigation.navigate('addExercise', { userid: user.usr_token, workoutid: null }) }} title='+' titleStyle={{ fontSize: 24 }} buttonStyle={{ width: 60, height: 60, borderRadius: 30, borderColor: '#1c7bc7' }} />
            </TouchableOpacity>
        </View>
    )
}