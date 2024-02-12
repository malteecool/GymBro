import {  getFirebaseTimeStamp, getHistoryByUser } from './ExerciseService.Service';


function startOfWeek(date) {
    var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function onlyUnique(value, index, array) {
    return array.indexOf(value) === index;
}

async function getWorkoutsCount(user) {
    var history = await getHistoryByUser(user.id);
    const dates = history.map(his => getFirebaseTimeStamp(his.exh_date.seconds, his.exh_date.nanoseconds));
    const uniqueDates = dates.filter(onlyUnique);
    const weeklyDates = uniqueDates.filter(d => new Date(d) >= startOfWeek(new Date()));
    return { lifetime: uniqueDates, weekly: weeklyDates };
}

function getWeekNumber(date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
    const week1 = new Date(target.getFullYear(), 0, 4);
    return (
        1 +
        Math.round(((target - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
    );
}

module.exports = {
    getWorkoutsCount: getWorkoutsCount,
    getWeekNumber: getWeekNumber
};
