import { SILENT } from '../utils/constants';
import {
	SET_MESSAGE,
	SET_USERS,
	SET_ACTIVE_USERS,
	SET_USERS_TOUCHED,
	SET_USERS_COUNTER,
	SET_ACTIVE_USERS_COUNTER
} from '../utils/actions';
import Message from '../models/message';
import User from '../models/user';
import Counter from '../models/counter';
let usersListener, usersCounterListener, activeUsersCounterListener;

export const subscribeUserListener = () => {
	return async (dispatch, getState) => {
		try {
			usersCounterListener = Counter.getListener('users').onSnapshot(
				(snapshot) => {
					const usersCounter = new Counter({
						...snapshot.data(),
						collection: snapshot.id
					});
					dispatch({
						type: SET_USERS_COUNTER,
						usersCounter
					});
				}
			);
			activeUsersCounterListener = Counter.getListener(
				'activeUsers'
			).onSnapshot((snapshot) => {
				const activeUsersCounter = new Counter({
					...snapshot.data(),
					collection: snapshot.id
				});
				dispatch({
					type: SET_ACTIVE_USERS_COUNTER,
					activeUsersCounter
				});
			});
			usersListener = User.getListener().onSnapshot((snapshot) => {
				const touched = getState().dataState.usersTouched;
				const locations = getState().dataState.locations;
				const actions = [];
				if (!touched) {
					actions.push({
						type: SET_USERS_TOUCHED
					});
				}
				const users = snapshot.docs.map((doc) => {
					const locationPopulated = locations.find(
						(location) => location.locationId === doc.data().location
					);
					const workFromHome = doc.data().settings.workFromHome;
					return new User({
						...doc.data(),
						userId: doc.id,
						location: locationPopulated,
						workFromHome: workFromHome
					});
				});
				actions.push({
					type: SET_USERS,
					users
				});
				actions.push({
					type: SET_ACTIVE_USERS,
					activeUsers: users.filter((user) => user.active)
				});
				dispatch(actions);
			});
		} catch (error) {
			const message = new Message({
				title: 'User',
				body: 'Users failed to retrieve',
				feedback: SILENT
			});
			dispatch({
				type: SET_MESSAGE,
				message
			});
		}
	};
};

export const unsubscribeUsersListener = () => {
	if (usersListener) {
		usersListener();
	}
	if (usersCounterListener) {
		usersCounterListener();
	}
	if (activeUsersCounterListener) {
		activeUsersCounterListener();
	}
};
