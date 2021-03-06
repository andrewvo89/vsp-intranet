import React, { useEffect, useState, useRef } from 'react';
import {
  Collapse,
  Typography,
  IconButton,
  Button,
  CardHeader,
  CardContent,
  CardActions,
  withTheme,
  Grid,
  Badge,
  Tooltip,
  Card
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import LeaveRequest from '../../../models/leave-request';
import Comments from '../../../components/Comments';
import { Skeleton } from '@material-ui/lab';
import Avatar from '../../../components/Avatar';
import scrollToComponent from 'react-scroll-to-component';
import { LONG_DATE_TIME } from '../../../utils/date';
import LeaveRequestForm from './LeaveRequestForm';
import ActionButtons from './ActionButtons';
import { addComment } from '../../../store/actions/leave-request';
import CommentOutlinedIcon from '@material-ui/icons/CommentOutlined';
import CommentRoundedIcon from '@material-ui/icons/CommentRounded';
import MoreVertIcon from '@material-ui/icons/MoreVert';

const LeaveRequestCard = withTheme((props) => {
  const dispatch = useDispatch();
  const scrollRef = useRef();
  const { authUser } = useSelector((state) => state.authState);
  const { users } = useSelector((state) => state.dataState);
  const { leaveRequestId, scroll, setActiveLeaveRequestId } = props;
  const [leaveRequest, setLeaveRequest] = useState();
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (scroll && leaveRequest) {
      scrollToComponent(scrollRef.current, {
        ease: 'linear',
        align: 'top',
        offset: -90,
        duration: 500
      });
      setActiveLeaveRequestId(null);
    }
  }, [scroll, setActiveLeaveRequestId, leaveRequest]);

  useEffect(() => {
    let leaveRequestListener;
    const asyncFunction = async () => {
      leaveRequestListener = LeaveRequest.getListener(
        leaveRequestId
      ).onSnapshot((doc) => {
        const metadata = {
          ...doc.data().metadata,
          createdAt: doc.data().metadata.createdAt.toDate(),
          updatedAt: doc.data().metadata.updatedAt.toDate()
        };
        const actions = doc.data().actions.map((action) => ({
          ...action,
          actionedAt: action.actionedAt.toDate()
        }));
        const start = doc.data().start.toDate();
        const end = doc.data().end.toDate();
        const newLeaveRequest = new LeaveRequest({
          ...doc.data(),
          leaveRequestId: doc.id,
          actions: actions,
          metadata: metadata,
          start: start,
          end: end
        });
        setLeaveRequest(newLeaveRequest);
      });
    };
    asyncFunction();
    return () => {
      leaveRequestListener();
    };
  }, [leaveRequestId, users]);

  if (!leaveRequest) {
    return (
      <Card elevation={2}>
        <CardHeader
          avatar={
            <Skeleton animation='pulse' variant='circle'>
              <Avatar user={authUser} />
            </Skeleton>
          }
          title={<Skeleton animation='pulse' height={20} width='60%' />}
          subheader={<Skeleton animation='pulse' height={20} width='40%' />}
          action={
            <IconButton disabled={true}>
              <MoreVertIcon />
            </IconButton>
          }
        />
        <CardContent>
          <Skeleton animation='pulse' variant='rect' height={200} />
        </CardContent>
        <CardActions style={{ padding: `${props.theme.spacing(2)}px` }}>
          <Skeleton animation='pulse' height={20} width='20%' />
          <Skeleton animation='pulse' height={30} width='10%' />
        </CardActions>
      </Card>
    );
  }

  const newCommentHandler = async (values) => {
    const result = await dispatch(addComment(leaveRequest, values));
    return result;
  };

  const commentsClickHandler = () => {
    setShowComments((prevState) => !prevState);
  };

  const commentLikeClickHandler = async (reverseIndex) => {
    //Comments get reversed to display newest first, need to switch it back
    const index = leaveRequest.comments.length - reverseIndex - 1;
    const newEvent = new LeaveRequest({ ...leaveRequest });
    await newEvent.toggleCommentLike(index);
  };

  let commentIcon = <CommentOutlinedIcon />;
  const commentUsers = leaveRequest.comments.map((comment) => comment.user);
  if (commentUsers.includes(authUser.userId)) {
    commentIcon = <CommentRoundedIcon />;
  }
  const commentToolip = () => {
    const commentUsers = users.filter((user) => {
      const commentUserIds = leaveRequest.comments.map(
        (comment) => comment.user
      );
      return commentUserIds.includes(user.userId);
    });
    const tooltip = commentUsers.map((commentUser) => (
      <div key={commentUser.userId}>{commentUser.getFullName()}</div>
    ));
    return tooltip;
  };

  const commentButton = (
    <Button
      style={{ textTransform: 'unset' }}
      size='small'
      color='secondary'
      onClick={commentsClickHandler}
      startIcon={
        <Badge color='secondary' badgeContent={leaveRequest.comments.length}>
          {commentIcon}
        </Badge>
      }
    >
      Comments
    </Button>
  );

  const user = users.find((user) => user.userId === leaveRequest.user);
  const postDate = leaveRequest.metadata.createdAt;

  return (
    <div ref={scrollRef}>
      <Card elevation={2}>
        <CardHeader
          avatar={<Avatar user={user} clickable={true} contactCard={true} />}
          title={user.getFullName()}
          titleTypographyProps={{
            variant: 'body1'
          }}
          subheader={leaveRequest.type}
        />
        <CardContent>
          <LeaveRequestForm leaveRequest={leaveRequest} />
        </CardContent>
        <CardActions style={{ padding: `${props.theme.spacing(2)}px` }}>
          <Grid container direction='column' spacing={2}>
            <Grid item container direction='row' justify='flex-end' spacing={1}>
              <ActionButtons
                leaveRequest={leaveRequest}
                user={user}
                isManager={authUser.userId === leaveRequest.manager}
              />
            </Grid>
            <Grid item container direction='row' justify='space-between'>
              <Grid item>
                <Typography color='secondary' component='span' variant='body2'>
                  {format(postDate, LONG_DATE_TIME)}
                </Typography>
              </Grid>
              <Grid item>
                {leaveRequest.comments.length > 0 ? (
                  <Tooltip title={commentToolip()}>{commentButton}</Tooltip>
                ) : (
                  commentButton
                )}
              </Grid>
            </Grid>
          </Grid>
        </CardActions>
        <Collapse in={showComments} timeout='auto'>
          <Comments
            collection='leave-requests'
            submitHandler={newCommentHandler}
            comments={[...leaveRequest.comments].reverse()}
            actionBarNotificationProps={{
              enabled: true,
              tooltip:
                'The leave request admin and your manager will be notified automatically',
              readOnly: true
            }}
            commentLikeClickHandler={commentLikeClickHandler}
          />
        </Collapse>
      </Card>
    </div>
  );
});

export default LeaveRequestCard;
