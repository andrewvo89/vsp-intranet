import React, { useState } from 'react';
import {
  Grid,
  Tooltip,
  IconButton,
  Badge,
  Button,
  withTheme,
  CircularProgress
} from '@material-ui/core';
import ProgressWithLabel from '../ProgressWithLabel';
import { useSelector } from 'react-redux';
import {
  Attachment as AttachmentIcon,
  People as PeopleIcon,
  Comment as CommentIcon
} from '@material-ui/icons';
import NotifyUsersList from '../NotifyUsersList';
import AttachmentsDropzone from '../AttachmentsDropZone';

const ActionsBar = withTheme((props) => {
  const { users } = useSelector((state) => state.dataState);
  const uploadState = useSelector((state) => state.uploadState);
  const [notifyUsersOpen, setNotifyUsersOpen] = useState(false);
  const [dropzoneOpen, setDropzoneOpen] = useState(false);
  const {
    notifications,
    attachments,
    comments,
    buttonLoading,
    disabled,
    isValid,
    onClick,
    tooltipPlacement,
    actionButtonText,
    additionalButtons
  } = props;

  function getAttachmentsTooltip(attachments) {
    let tooltip = attachments.emptyTooltip || 'Attachments';
    if (attachments.attachments.length > 0) {
      tooltip = attachments.attachments.map((attachment) => (
        <div key={attachment.name}>{attachment.name}</div>
      ));
    }
    return tooltip;
  }

  function getNotfyUsersTooltip(notifications, users) {
    let tooltip = notifications.emptyTooltip || 'Notify Staff';
    if (notifications.tooltip) {
      tooltip = notifications.tooltip;
    }
    if (notifications.notifyUsers?.length > 0) {
      tooltip = notifications.notifyUsers.map((notifyUser) => {
        const notifyUserObject = users.find(
          (user) => user.userId === notifyUser
        );
        return <div key={notifyUser}>{notifyUserObject.getFullName()}</div>;
      });
    }
    return tooltip;
  }

  function getCommentsTooltip(comments, users) {
    let tooltip = 'Comments';
    if (comments.comments.length > 0) {
      const commentUsers = users.filter((user) => {
        const commentUserIds = comments.comments.map((comment) => comment.user);
        return commentUserIds.includes(user.userId);
      });
      tooltip = commentUsers.map((commentUser) => (
        <div key={commentUser.userId}>{commentUser.getFullName()}</div>
      ));
    }
    return tooltip;
  }

  function getCommentsButton(comments) {
    return (
      <IconButton disabled={disabled} onClick={comments.clickHandler}>
        <Badge badgeContent={comments.comments.length} color='secondary'>
          <CommentIcon />
        </Badge>
      </IconButton>
    );
  }

  function getNotificationButton(notifications) {
    return (
      <IconButton
        disabled={disabled}
        onClick={
          notifications.readOnly ? null : setNotifyUsersOpen.bind(this, true)
        }
      >
        <Badge
          badgeContent={notifications.notifyUsers?.length}
          color='secondary'
        >
          <PeopleIcon />
        </Badge>
      </IconButton>
    );
  }

  function getAttachmentsButton(attachments) {
    return (
      <IconButton
        onClick={setDropzoneOpen.bind(this, true)}
        disabled={disabled}
      >
        <Badge badgeContent={attachments.attachments.length} color='secondary'>
          <AttachmentIcon />
        </Badge>
      </IconButton>
    );
  }

  return (
    <Grid container direction='column'>
      {uploadState.filesProgress && (
        <Grid item>
          <ProgressWithLabel
            transferred={uploadState.filesProgress.reduce(
              (total, value) => (total += value.bytesTransferred),
              0
            )}
            total={uploadState.filesProgress.reduce(
              (total, value) => (total += value.totalBytes),
              0
            )}
          />
        </Grid>
      )}
      <Grid item container direction='row' wrap='nowrap' spacing={1}>
        <Grid
          item
          container
          direction='row'
          justify='flex-end'
          alignItems='center'
        >
          {comments?.enabled && (
            <Grid item>
              {disabled ? (
                getCommentsButton(comments)
              ) : (
                <Tooltip
                  title={getCommentsTooltip(comments, users)}
                  placement={tooltipPlacement}
                >
                  {getCommentsButton(comments)}
                </Tooltip>
              )}
            </Grid>
          )}
          {notifications?.enabled && (
            <Grid item>
              {disabled ? (
                getNotificationButton(notifications)
              ) : (
                <Tooltip
                  title={getNotfyUsersTooltip(notifications, users)}
                  placement={tooltipPlacement}
                >
                  {getNotificationButton(notifications)}
                </Tooltip>
              )}
              <NotifyUsersList
                close={() => setNotifyUsersOpen(false)}
                open={notifyUsersOpen}
                setNotifyUsers={notifications.setNotifyUsers}
                notifyUsers={notifications.notifyUsers}
              />
            </Grid>
          )}
          {attachments?.enabled && (
            <Grid item>
              {disabled ? (
                getAttachmentsButton(attachments)
              ) : (
                <Tooltip
                  title={getAttachmentsTooltip(attachments)}
                  placement={tooltipPlacement}
                >
                  {getAttachmentsButton(attachments)}
                </Tooltip>
              )}
              <AttachmentsDropzone
                dropzoneOpen={dropzoneOpen}
                setDropzoneOpen={setDropzoneOpen}
                attachments={attachments.attachments}
                setAttachments={attachments.setAttachments}
              />
            </Grid>
          )}
        </Grid>
        <Grid
          item
          container
          direction='row'
          justify='flex-end'
          alignItems='center'
          wrap='nowrap'
          spacing={1}
          style={{ flex: 1 }}
        >
          {additionalButtons &&
            additionalButtons.map((additionalButton) => (
              <Grid
                key={additionalButton.buttonText}
                item
                container
                justify='center'
                alignItems='center'
                style={{ position: 'relative' }}
              >
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={additionalButton.onClick}
                  disabled={additionalButton.buttonDisabled || disabled}
                >
                  {additionalButton.buttonText}
                </Button>
                {additionalButton.buttonLoading && (
                  <CircularProgress
                    style={{ position: 'absolute' }}
                    size={25}
                  />
                )}
              </Grid>
            ))}
          <Grid
            item
            container
            justify='center'
            alignItems='center'
            style={{ position: 'relative' }}
          >
            <Button
              variant='outlined'
              color='primary'
              onClick={onClick}
              disabled={!isValid || disabled}
            >
              {actionButtonText}
            </Button>
            {buttonLoading && (
              <CircularProgress style={{ position: 'absolute' }} size={25} />
            )}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
});

export default ActionsBar;
