import Message from '../../models/message';
import { SET_MESSAGE } from '../../utils/actions';
import {
  DIALOG,
  SNACKBAR,
  SNACKBAR_SEVERITY,
  SNACKBAR_VARIANTS
} from '../../utils/constants';
import Resource from '../../models/resource';

export const addResource = (values) => {
  return async (dispatch, getState) => {
    const { folder, name, link } = values;
    const { authUser } = getState().authState;
    const newResource = new Resource({
      folder: folder.trim(),
      name: name.trim(),
      link: link.trim(),
      user: authUser.userId
    });
    try {
      await newResource.save();
      const message = new Message({
        title: 'Resources',
        body: 'Resource added successfully',
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
        title: 'Resources',
        body: 'Failed to add resource',
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

export const editResource = (resource, values) => {
  return async (dispatch, _getState) => {
    const { folder, name, link } = values;
    const newResource = new Resource({
      ...resource,
      folder: folder.trim(),
      name: name.trim(),
      link: link.trim()
    });
    try {
      await newResource.save();
      const message = new Message({
        title: 'Resources',
        body: 'Resource updated successfully',
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
        title: 'Resources',
        body: 'Failed to update resource',
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

export const deleteResource = (resource) => {
  return async (dispatch, _getState) => {
    try {
      const newResource = new Resource({ ...resource });
      await newResource.delete();
      const message = new Message({
        title: 'Resources',
        body: 'Resource deleted successfully',
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
      const message = new Message({
        title: 'Resources',
        body: 'Failed to delete resource',
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
