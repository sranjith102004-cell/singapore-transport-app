import * as Notifications from 'expo-notifications';

export const getNotificationPermissionStatus = async () => {
  const permissions = await Notifications.getPermissionsAsync();
  return permissions.status;
};
