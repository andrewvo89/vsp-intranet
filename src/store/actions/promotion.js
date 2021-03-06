import Message from '../../models/message';
import Promotion from '../../models/promotion';
import { SET_MESSAGE } from '../../utils/actions';
import {
  DIALOG,
  SNACKBAR,
  SNACKBAR_SEVERITY,
  SNACKBAR_VARIANTS
} from '../../utils/constants';
import { compareAndDelete, upload } from '../../utils/file-utils';
import { getServerTimeInMilliseconds } from '../../utils/firebase';

export const addPromotion = (values) => {
  return async (dispatch, getState) => {
    const { attachments, notifyUsers, title, body } = values;
    const { authUser } = getState().authState;
    const newPromotion = new Promotion({
      //The rest of .actions will be filled out in the model
      actions: [{ notifyUsers: notifyUsers }],
      attachments: [],
      body: body.trim(),
      comments: [],
      expiry: values.expiry,
      likes: [],
      title: title.trim(),
      user: authUser.userId
    });
    try {
      await newPromotion.save();
      let uploadedAttachments = [];
      if (attachments.length > 0) {
        uploadedAttachments = await dispatch(
          upload({
            files: attachments,
            collection: 'promotions',
            collectionId: newPromotion.promotionId,
            folder: newPromotion.metadata.createdAt.getTime().toString()
          })
        );
      }
      newPromotion.attachments = uploadedAttachments;
      await newPromotion.save();
      const message = new Message({
        title: 'Promotions',
        body: 'Promotion created successfully',
        feedback: SNACKBAR,
        options: {
          duration: 5000,
          variant: SNACKBAR_VARIANTS.FILLED,
          severity: SNACKBAR_SEVERITY.INFO
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
        title: 'Promotions',
        body: 'Promotion failed to post',
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

export const editPromotion = (promotion, values) => {
  return async (dispatch, _getState) => {
    const { attachments, notifyUsers, title, body, expiry } = values;
    //Handle any attachment deletions
    const existingAttachments = attachments.filter(
      (attachment) => !(attachment instanceof File)
    );
    await compareAndDelete({
      oldAttachments: promotion.attachments,
      newAttachments: existingAttachments,
      collection: 'promotions',
      collectionId: promotion.promotionId,
      folder: promotion.metadata.createdAt.getTime().toString()
    });
    //Handle new attachments to be uploaded
    const toBeUploadedAttachments = attachments.filter(
      (attachment) => attachment instanceof File
    );
    let uploadedAttachments = [];
    if (toBeUploadedAttachments.length > 0) {
      uploadedAttachments = await dispatch(
        upload({
          files: toBeUploadedAttachments,
          collection: 'promotions',
          collectionId: promotion.promotionId,
          folder: promotion.metadata.createdAt.getTime().toString()
        })
      );
    }
    const newPromotion = new Promotion({
      promotionId: promotion.promotionId,
      actions: [...promotion.actions, { notifyUsers: notifyUsers }],
      attachments: [...existingAttachments, ...uploadedAttachments],
      body: body.trim(),
      comments: promotion.comments,
      expiry: expiry,
      likes: promotion.likes,
      metadata: promotion.metadata,
      title: title.trim(),
      user: promotion.user
    });
    try {
      await newPromotion.save();
      const message = new Message({
        title: 'Promotions',
        body: 'Promotion updated successfully',
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
        title: 'Promotion',
        body: 'Failed to update promotion',
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

export const deletePromotion = (promotion) => {
  return async (dispatch, _getState) => {
    try {
      const newPromotion = new Promotion({ ...promotion });
      await newPromotion.delete();
      const message = new Message({
        title: 'Promotions',
        body: 'Promotion deleted successfully',
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
        title: 'Promotions',
        body: 'Failed to delete promotion',
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

export const addComment = (promotion, values) => {
  return async (dispatch, _getState) => {
    const { body, attachments, notifyUsers } = values;
    const newPromotion = new Promotion({ ...promotion });
    let uploadedAttachments = [];
    try {
      const serverTime = await getServerTimeInMilliseconds();
      if (attachments.length > 0) {
        uploadedAttachments = await dispatch(
          upload({
            files: attachments,
            collection: 'promotions',
            collectionId: promotion.promotionId,
            folder: serverTime.toString()
          })
        );
      }
      await newPromotion.saveComment(
        body.trim(),
        uploadedAttachments,
        notifyUsers,
        serverTime
      );
      return true;
    } catch (error) {
      console.error(error);
      const message = new Message({
        title: 'Promotions',
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
