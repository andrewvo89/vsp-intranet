import {
  DIALOG,
  SNACKBAR,
  SNACKBAR_VARIANTS,
  SNACKBAR_SEVERITY
} from '../../utils/constants';
import { SET_MESSAGE } from '../../utils/actions';
import Message from '../../models/message';
import Event from '../../models/event';
import { transformDate } from '../../utils/date';
import { getServerTimeInMilliseconds } from '../../utils/firebase';
import { upload } from '../../utils/file-utils';

export const addEvent = (values) => {
  return async (dispatch, getState) => {
    const {
      notifyUsers,
      allDay,
      details,
      end,
      start,
      type,
      allCalendars,
      user
    } = values;
    const {
      locations: dataStateLocations,
      users: dataStateUsers
    } = getState().dataState;
    const eventUser = dataStateUsers.find(
      (dataStateUser) => dataStateUser.userId === user
    );
    const eventUserLocation = dataStateLocations.find(
      (dataStateLocation) =>
        dataStateLocation.locationId === eventUser.location.locationId
    );
    let locations = [eventUserLocation.locationId];
    if (allCalendars) {
      locations = dataStateLocations.map((location) => location.locationId);
    }
    let startTransformed = transformDate(
      start,
      allDay,
      eventUserLocation.timezone
    );
    let endTransformed = transformDate(end, allDay, eventUserLocation.timezone);
    const newEvent = new Event({
      allDay: allDay,
      comments: [],
      details: details.trim(),
      end: endTransformed,
      locations: locations,
      start: startTransformed,
      subscribers: [user],
      type: type.name,
      user: user
    });
    try {
      await newEvent.save(notifyUsers);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Event added successfully',
        feedback: SNACKBAR,
        options: {
          duration: 5000,
          variant: SNACKBAR_VARIANTS.FILLED,
          severity: SNACKBAR_SEVERITY.SUCCESS
        }
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return true;
    } catch (error) {
      console.error(error);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Failed to add event',
        feedback: DIALOG
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return false;
    }
  };
};

export const editEvent = (event, values) => {
  return async (dispatch, getState) => {
    const {
      notifyUsers,
      allDay,
      details,
      end,
      start,
      type,
      allCalendars,
      user
    } = values;
    const {
      locations: dataStateLocations,
      users: dataStateUsers
    } = getState().dataState;
    const eventUser = dataStateUsers.find(
      (dataStateUser) => dataStateUser.userId === user
    );
    const eventUserLocation = dataStateLocations.find(
      (dataStateLocation) =>
        dataStateLocation.locationId === eventUser.location.locationId
    );
    let locations = [eventUserLocation.locationId];
    if (allCalendars) {
      locations = dataStateLocations.map((location) => location.locationId);
    }
    let startTransformed = transformDate(
      start,
      allDay,
      eventUserLocation.timezone
    );
    let endTransformed = transformDate(end, allDay, eventUserLocation.timezone);
    const newEvent = new Event({
      ...event,
      allDay: allDay,
      details: details.trim(),
      end: endTransformed,
      locations: locations,
      start: startTransformed,
      type: type.name,
      user: user
    });
    try {
      await newEvent.save(notifyUsers);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Event updated successfully',
        feedback: SNACKBAR,
        options: {
          duration: 5000,
          variant: SNACKBAR_VARIANTS.FILLED,
          severity: SNACKBAR_SEVERITY.SUCCESS
        }
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return true;
    } catch (error) {
      console.error(error);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Failed to update event',
        feedback: DIALOG
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return false;
    }
  };
};

export const deleteEvent = (event, notifyUsers) => {
  return async (dispatch, _getState) => {
    try {
      const newEvent = new Event({ ...event });
      await newEvent.delete(notifyUsers);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Event deleted successfully',
        feedback: SNACKBAR,
        options: {
          duration: 5000,
          variant: SNACKBAR_VARIANTS.FILLED,
          severity: SNACKBAR_SEVERITY.SUCCESS
        }
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return true;
    } catch (error) {
      console.error(error);
      const message = new Message({
        title: 'Staff Calendar',
        body: 'Failed to delete event',
        feedback: DIALOG
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return false;
    }
  };
};

export const addComment = (event, values) => {
  return async (dispatch, _getState) => {
    const newEvent = new Event({ ...event });
    const { body, attachments, notifyUsers } = values;
    let uploadedAttachments;
    try {
      const serverTime = await getServerTimeInMilliseconds();
      uploadedAttachments = [];
      if (attachments.length > 0) {
        uploadedAttachments = await dispatch(
          upload({
            files: attachments,
            collection: 'events',
            collectionId: event.eventId,
            folder: serverTime.toString()
          })
        );
      }
      await newEvent.saveComment(
        body.trim(),
        uploadedAttachments,
        notifyUsers,
        serverTime
      );
      return true;
    } catch (error) {
      console.error(error);
      const message = new Message({
        title: 'Events',
        body: 'Comment failed to post',
        feedback: DIALOG
      });
      dispatch({
        type: SET_MESSAGE,
        message
      });
      return false;
    }
  };
};
