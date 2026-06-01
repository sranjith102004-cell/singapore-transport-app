import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const scheduleBusReminderNotification = async (
  serviceNo: string,
  minutesBefore: number,
  secondsFromNow: number
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Bus ${serviceNo}`,
      body: `Arriving in ${minutesBefore} minutes`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsFromNow,
    },
  });

  return true;
};

export const requestBusReminderPermissions = async () => {
  await Notifications.requestPermissionsAsync();
};
