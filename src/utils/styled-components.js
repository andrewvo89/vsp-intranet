import React from 'react';
import styled from 'styled-components';
import {
	Input,
	DialogContent,
	Card,
	CardContent,
	CardHeader,
	CardActions,
	Avatar,
	Button,
	Snackbar
} from '@material-ui/core';
import * as styles from './styles';
import * as colors from './colors';

export const StyledButton = styled(Button)`
	width: 100%;
	margin-bottom: 10px;
`;

export const StyledInput = styled(Input)`
	&.MuiInput-underline.Mui-error:after {
		border-bottom-color: #e57373;
	}
`;

export const StyledDialogContent = styled(DialogContent)`
	width: 400px;
`;

export const StyledCard = styled(Card)`
	min-width: 400px;
`;

export const StyledCardContent = styled(CardContent)`
	display: flex;
	flex-direction: column;
`;

export const StyledCardHeader = styled(CardHeader)`
	text-align: center;
	padding-bottom: 0;
	& .MuiCardHeader-title {
		font-size: xx-large;
	}
`;

export const StyledCardActions = styled(CardActions)`
	display: flex;
	flex-direction: column;
	& > :not(:first-child) {
		margin-left: 0;
	}
`;

// eslint-disable-next-line no-unused-vars
export const StyledAvatar = styled(({ darkMode, ...otherProps }) => (
	<Avatar {...otherProps} />
))`
	width: ${(props) => styles.avatarStyles.width * props.size}px;
	height: ${(props) => styles.avatarStyles.height * props.size}px;
	font-size: ${(props) => styles.avatarStyles.fontSize * props.size}rem;
	background-color: ${(props) =>
		props.dark
			? colors.default.secondary.light
			: colors.default.secondary.dark};
	margin: 10px;
	&:hover {
		cursor: pointer;
	}
`;

// eslint-disable-next-line no-unused-vars
export const StyledSnackbar = styled(({ hover, ...otherProps }) => (
	<Snackbar {...otherProps} />
))`
	&:hover {
		cursor: ${(props) => (props.hover ? 'pointer' : 'default')};
	}
`;
