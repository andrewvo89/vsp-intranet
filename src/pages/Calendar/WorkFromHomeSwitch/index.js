import React from 'react';
import {
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Switch,
	List
} from '@material-ui/core';
import * as authController from '../../../controllers/auth-user';
import { useSelector, useDispatch } from 'react-redux';

const WorkFromHomeSwitch = (props) => {
	const { authUser } = useSelector((state) => state.authState);
	const dispatch = useDispatch();

	const switchChangeHandler = async (settings) => {
		await dispatch(authController.updateSettings(settings));
	};

	return (
		<List>
			<ListItem>
				<ListItemText primary='Work from Home' />
				<ListItemSecondaryAction>
					<Switch
						color='primary'
						checked={authUser.settings.workFromHome}
						onChange={() =>
							switchChangeHandler({
								...authUser.settings,
								workFromHome: !authUser.settings.workFromHome
							})
						}
					/>
				</ListItemSecondaryAction>
			</ListItem>
		</List>
	);
};

export default WorkFromHomeSwitch;
