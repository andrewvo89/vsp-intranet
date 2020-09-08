import React, { useState, useEffect } from 'react';
import {
	Button,
	List,
	ListItemAvatar,
	ListItemText,
	ListItemSecondaryAction,
	Checkbox,
	Dialog,
	DialogActions,
	useMediaQuery
} from '@material-ui/core';
import { useSelector } from 'react-redux';
import {
	StyledTitleListItem,
	StyledListItem,
	StyledListItemText,
	StyledDialogContent,
	StyledDialogTitle
} from './styled-components';
import { AvatarGroup } from '@material-ui/lab';
import Avatar from '../Avatar';

const NotifyUsersList = (props) => {
	const {
		notifyUsersOpen,
		setNotifyUsersOpen,
		notifyUsers,
		setNotifyUsers
	} = props;
	const { users } = useSelector((state) => state.dataState);
	const [checkedUsers, setCheckedUsers] = useState([]);

	useEffect(() => {
		if (notifyUsers) {
			setCheckedUsers(notifyUsers);
		}
	}, [notifyUsersOpen, notifyUsers]);

	const closeHandler = () => {
		setNotifyUsersOpen(false);
		setCheckedUsers([]);
	};

	const confirmClickHandler = () => {
		setNotifyUsersOpen(false);
		setNotifyUsers(checkedUsers);
		setCheckedUsers([]);
	};

	const checkHandler = (user, checked) => () => {
		const newCheckedUsers = [...checkedUsers];
		if (checked) {
			const index = checkedUsers.findIndex(
				(checkedUser) => checkedUser.userId === user.userId
			);
			newCheckedUsers.splice(index, 1);
		} else {
			newCheckedUsers.push(user);
		}
		setCheckedUsers(newCheckedUsers);
	};

	const selectAllCheckHandler = () => {
		const checked = users.length === checkedUsers.length;
		let newCheckedUsers;
		if (checked) {
			newCheckedUsers = [];
		} else {
			newCheckedUsers = [...users];
		}
		setCheckedUsers(newCheckedUsers);
	};

	const mobile = useMediaQuery('(max-width: 767px)');

	return (
		<Dialog open={notifyUsersOpen} onClose={closeHandler}>
			<StyledDialogTitle>
				<List dense={true}>
					<StyledTitleListItem>
						{checkedUsers.length > 0 ? (
							<ListItemAvatar>
								<AvatarGroup max={mobile ? 3 : 6}>
									{checkedUsers.map((checkedUser) => (
										<Avatar key={checkedUser.userId} user={checkedUser} />
									))}
								</AvatarGroup>
							</ListItemAvatar>
						) : null}
						<StyledListItemText
							primary={'Select all'}
							secondary={`${checkedUsers.length} selected`}
						/>
						<ListItemSecondaryAction>
							<Checkbox
								edge='end'
								onChange={selectAllCheckHandler}
								checked={users.length === checkedUsers.length}
								indeterminate={
									checkedUsers.length > 0 && checkedUsers.length < users.length
								}
							/>
						</ListItemSecondaryAction>
					</StyledTitleListItem>
				</List>
			</StyledDialogTitle>
			<StyledDialogContent>
				<List dense={true}>
					{users.map((user) => {
						const { firstName, lastName } = user;
						const checked = checkedUsers.some(
							(checkedUser) => checkedUser.userId === user.userId
						);
						return (
							<StyledListItem
								key={user.userId}
								onClick={checkHandler(user, checked)}
							>
								<ListItemAvatar>
									<Avatar user={user} />
								</ListItemAvatar>
								<ListItemText primary={`${firstName} ${lastName}`} />
								<ListItemSecondaryAction>
									<Checkbox
										edge='end'
										onChange={checkHandler(user, checked)}
										checked={checked}
									/>
								</ListItemSecondaryAction>
							</StyledListItem>
						);
					})}
				</List>
			</StyledDialogContent>
			<DialogActions>
				<Button onClick={closeHandler} color='primary' variant='outlined'>
					Cancel
				</Button>
				<Button
					onClick={confirmClickHandler}
					color='primary'
					variant='contained'
				>
					Confirm
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default NotifyUsersList;