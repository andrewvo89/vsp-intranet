import React, { useState, useEffect, useRef, Fragment } from 'react';
import {
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	MenuItem,
	Grid,
	FormGroup,
	FormControlLabel,
	Checkbox,
	Tooltip
} from '@material-ui/core';
import ActionsBar from '../../../components/ActionsBar';
import { useFormik } from 'formik';
import * as yup from 'yup';
import eventTypes from '../../../utils/event-types';
import { StyledDialog, GridFlexGrow } from '../../../utils/styled-components';
import { useSelector, useDispatch } from 'react-redux';
import {
	DateTimePicker,
	DatePicker,
	MuiPickersUtilsProvider
} from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import { getReadableTitle } from '../../../controllers/event';
import { StyledTitle } from './styled-components';
import * as eventController from '../../../controllers/event';
import * as notificationController from '../../../controllers/notification';
import { EDIT_EVENT, DELETE_EVENT } from '../../../utils/notification-types';
import ConfirmDialog from '../../../components/ConfirmDialog';

const EditEventDialog = (props) => {
	const dispatch = useDispatch();
	const detailsFieldRef = useRef();
	const { authUser } = useSelector((state) => state.authState);
	const { users, locations } = useSelector((state) => state.dataState);
	const [notifyUsers, setNotifyUsers] = useState([]);
	const [editLoading, setEditLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const loading = deleteLoading || editLoading;
	const { open, close, event } = props;

	const initialValues = {
		type: eventTypes.find((eventType) => eventType.eventTypeId === event.type),
		details: event.details,
		start: event.start,
		end: event.end,
		allDay: event.allDay,
		allCalendars: locations.every((location) =>
			event.locations.includes(location.locationId)
		)
	};

	const validationSchema = yup.object().shape({
		type: yup
			.object()
			.label('Event type')
			.required()
			.test('isValidArrayElement', 'Event type not valid', (value) =>
				eventTypes.find((type) => type.eventTypeId === value.eventTypeId)
			),
		details: yup
			.string()
			.label('Details')
			.when('type', {
				is: (value) => value.detailsEditable,
				then: yup.string().required(),
				otherwise: yup.string().notRequired()
			}),
		start: yup.date().label('Start date').required(),
		end: yup.date().label('End date').required().min(yup.ref('start')),
		allDay: yup.boolean().label('All day').required(),
		allCalendars: yup.boolean().label('allCalendars').required()
	});

	const submitHandler = async (values) => {
		setEditLoading(true);
		const newEvent = await dispatch(
			eventController.editEvent(event, values, notifyUsers)
		);
		setEditLoading(false);
		if (newEvent) {
			close();
			const recipients = users.filter(
				(user) =>
					newEvent.subscribers.includes(user.userId) ||
					notifyUsers.includes(user.userId)
			);
			try {
				const readableTitle = getReadableTitle(
					{
						details: newEvent.details,
						type: newEvent.type,
						user: newEvent.user
					},
					users
				);
				notificationController.sendNotification({
					type: EDIT_EVENT,
					recipients: recipients,
					eventId: newEvent.eventId,
					title: readableTitle,
					start: newEvent.start.getTime(),
					end: newEvent.end.getTime(),
					allDay: newEvent.allDay
				});
				// eslint-disable-next-line no-empty
			} catch (error) {}
		}
	};

	const deleteHandler = async () => {
		setDeleteLoading(true);
		const result = await dispatch(
			eventController.deleteEvent(event, notifyUsers)
		);
		setDeleteLoading(false);
		if (result) {
			close();
			const recipients = users.filter(
				(user) =>
					event.subscribers.includes(user.userId) ||
					notifyUsers.includes(user.userId)
			);
			try {
				const readableTitle = getReadableTitle(
					{
						details: event.details,
						type: event.type,
						user: event.user
					},
					users
				);
				notificationController.sendNotification({
					type: DELETE_EVENT,
					recipients: recipients,
					title: readableTitle,
					start: event.start.getTime(),
					end: event.end.getTime(),
					allDay: event.allDay
				});
				// eslint-disable-next-line no-empty
			} catch (error) {}
		}
	};

	const closeHandler = () => {
		if (!loading) {
			close();
		}
	};

	const formik = useFormik({
		initialValues: initialValues,
		onSubmit: submitHandler,
		validationSchema: validationSchema
	});

	const { start, end, type } = formik.values;
	const { setFieldValue } = formik;

	useEffect(() => {
		if (type) {
			//Autofocus details field
			if (type.detailsEditable) {
				if (detailsFieldRef.current) {
					detailsFieldRef.current.select();
				}
			}
			//Set public events checkbox
			if (type.allCalendars) {
				setFieldValue('allCalendars', type.allCalendars);
			}
		}
	}, [type, setFieldValue]);
	//Add 1 hour if end date is set to less than start date
	useEffect(() => {
		if (moment(start).isAfter(moment(end))) {
			setFieldValue('end', moment(start).add(1, 'hour').toDate());
		}
	}, [start, end, setFieldValue]);

	const readableTitle = getReadableTitle(
		{
			details: formik.values.details,
			type: formik.values.type.eventTypeId,
			user: authUser.userId
		},
		users
	);

	let StartPicker = DateTimePicker;
	let EndPicker = DateTimePicker;
	let dateFormat = 'ddd, D MMM YYYY, h:mm a';
	if (formik.values.allDay) {
		StartPicker = DatePicker;
		EndPicker = DatePicker;
		dateFormat = 'ddd, D MMM YYYY';
	}

	return (
		<Fragment>
			<ConfirmDialog
				open={showConfirmDialog}
				cancel={() => setShowConfirmDialog(false)}
				confirm={deleteHandler}
				title='Staff Calendar'
				message='Are you sure you want to delete this event?'
			/>
			<StyledDialog open={open} onClose={closeHandler} width={500}>
				<DialogTitle>
					<StyledTitle>{`Title Preview: ${readableTitle}`}</StyledTitle>
				</DialogTitle>
				<DialogContent>
					<Grid container direction='column' spacing={1}>
						<Grid item>
							<TextField
								label='Event type'
								select={true}
								fullWidth={true}
								value={formik.values.type}
								onBlur={formik.handleBlur('type')}
								onChange={formik.handleChange('type')}
							>
								{eventTypes.map((type) => (
									<MenuItem key={type.eventTypeId} value={type}>
										{type.name}
									</MenuItem>
								))}
							</TextField>
						</Grid>
						{formik.values.type.detailsEditable ? (
							<Grid item>
								<TextField
									inputRef={detailsFieldRef}
									label='Details'
									fullWidth={true}
									value={formik.values.details}
									onBlur={formik.handleBlur('details')}
									onChange={formik.handleChange('details')}
									autoFocus={true}
								/>
							</Grid>
						) : null}
						<Grid
							item
							container
							direction='row'
							justify='space-between'
							spacing={2}
						>
							<GridFlexGrow item>
								<MuiPickersUtilsProvider utils={MomentUtils}>
									<StartPicker
										label='Start'
										value={formik.values.start}
										onChange={(value) =>
											formik.setFieldValue('start', value.toDate())
										}
										onBlur={formik.handleBlur('start')}
										format={dateFormat}
										fullWidth={true}
									/>
								</MuiPickersUtilsProvider>
							</GridFlexGrow>
							<GridFlexGrow item>
								<MuiPickersUtilsProvider utils={MomentUtils}>
									<EndPicker
										label='End'
										value={formik.values.end}
										onChange={(value) =>
											formik.setFieldValue('end', value.toDate())
										}
										onBlur={formik.handleBlur('end')}
										format={dateFormat}
										fullWidth={true}
										minDate={formik.values.start}
									/>
								</MuiPickersUtilsProvider>
							</GridFlexGrow>
						</Grid>
						<Grid item>
							<FormGroup row>
								<Tooltip
									title='Event will not have any time boundaries'
									arrow={true}
								>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.allDay}
												onChange={formik.handleChange('allDay')}
												onBlur={formik.handleBlur('allDay')}
											/>
										}
										label='All day event'
									/>
								</Tooltip>
								<Tooltip
									title="Event will appear on all state's calendars"
									arrow={true}
								>
									<FormControlLabel
										control={
											<Checkbox
												checked={formik.values.allCalendars}
												onChange={formik.handleChange('allCalendars')}
												onBlur={formik.handleBlur('allCalendars')}
											/>
										}
										label='Publish to all calendars'
									/>
								</Tooltip>
							</FormGroup>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions>
					<ActionsBar
						notifications={{
							enabled: true,
							notifyUsers: notifyUsers,
							setNotifyUsers: setNotifyUsers
						}}
						attachments={{
							enabled: false
						}}
						buttonLoading={editLoading}
						loading={loading}
						isValid={formik.isValid}
						onClick={formik.handleSubmit}
						tooltipPlacement='top'
						actionButtonText='Update'
						additionalButtons={[
							{
								buttonText: 'Delete',
								onClick: () => setShowConfirmDialog(true),
								buttonLoading: deleteLoading
							}
						]}
					/>
				</DialogActions>
			</StyledDialog>
		</Fragment>
	);
};

export default EditEventDialog;
