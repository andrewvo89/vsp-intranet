import {
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  TextField,
  withTheme
} from '@material-ui/core';
import Autocomplete, {
  createFilterOptions
} from '@material-ui/lab/Autocomplete';
import { useFormik } from 'formik';
import * as yup from 'yup';
import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import projectStatusTypes from '../../../data/project-status-types';
import Customer from '../../../models/customer';
import Vendor from '../../../models/vendor';
import User from '../../../models/user';
import { DatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { LONG_DATE } from '../../../utils/date';
import ActionsBar from '../../../components/ActionsBar';
import Comments from '../../../components/Comments';
import { subscribeCustomerListener } from '../../../store/actions/customer';
import { subscribeVendorListener } from '../../../store/actions/vendor';
import { addComment, editProject } from '../../../store/actions/project';
import Avatar from '../../../components/Avatar';
import Project from '../../../models/project';
const filter = createFilterOptions();

const EditProjectDialog = withTheme((props) => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.authState);
  const { customers, vendors, users } = useSelector((state) => state.dataState);
  const { open, close, projectNames, project } = props;

  const [showComments, setShowComments] = useState(false);
  const [editLoading, setEditLoading] = useState();
  const [commentLoading, setCommentLoading] = useState(false);

  const [validatedOnMount, setValidatedOnMount] = useState(false);
  //Customer field
  const [customersOpen, setCustomersOpen] = useState(false);
  const [customerAdding, setCustomerAdding] = useState(false);
  const customersLoading = (customersOpen && !customers) || customerAdding;
  useEffect(() => {
    if (customersLoading) {
      dispatch(subscribeCustomerListener());
    }
  }, [customersLoading, dispatch]);
  //Vendor field
  const [vendorsOpen, setVendorsOpen] = useState(false);
  const [vendorAdding, setVendorAdding] = useState(false);
  const vendorsLoading = (vendorsOpen && !vendors) || vendorAdding;

  const loading =
    editLoading || commentLoading || customersLoading || vendorsLoading;

  useEffect(() => {
    if (vendorsLoading) {
      dispatch(subscribeVendorListener());
    }
  }, [vendorsLoading, dispatch]);

  const validationSchema = yup.object().shape({
    attachments: yup.array().notRequired(),
    name: yup
      .string()
      .label('Project Name')
      .required()
      .test('isNotExistingProject', 'Project already exists', (value) => {
        const inputValue = value ? value : '';
        const projectExists = projectNames.find(
          (projectName) =>
            projectName.trim().toLowerCase() === inputValue.trim().toLowerCase()
        );
        return !projectExists;
      }),
    description: yup.string().label('Description').trim().required(),
    customer: yup
      .object()
      .typeError('Customer a required field')
      .label('Customer')
      .required()
      .test(
        'isValidType',
        'Customer is not valid',
        (value) => value instanceof Customer
      ),
    vendors: yup
      .array()
      .label('Vendors')
      .required()
      .min(1)
      .test('isValidArrayElement', 'Vendors are not valid', (value) => {
        return value.every(
          (selectedVendor) => selectedVendor instanceof Vendor
        );
      }),
    owners: yup
      .array()
      .label('Owners')
      .required()
      .min(1)
      .test('isValidArrayElement', 'Owners are not valid', (value) => {
        if (!users) {
          return false;
        }
        return value.every(
          (selectedOwner) =>
            selectedOwner instanceof User &&
            users.find((user) => user.userId === selectedOwner.userId)
        );
      }),
    status: yup
      .string()
      .label('Status')
      .required()
      .test('isValidArrayElement', 'Status is not valid', (value) =>
        projectStatusTypes.find((status) => status === value)
      ),
    reminder: yup
      .date()
      .typeError('Date is a required field')
      .label('Reminder Date')
      .required(),
    value: yup.number().label('Value').required().min(0).max(10000000)
  });

  const initialValues = {
    attachments: project.attachments,
    name: project.name,
    description: project.description,
    customer: new Customer({ ...project.customer }),
    vendors: project.vendors.map((vendor) => new Vendor({ ...vendor })),
    owners: project.owners,
    status: projectStatusTypes.find(
      (status) =>
        status === project.actions[project.actions.length - 1].actionType
    ),
    reminder: new Date(project.reminder),
    value: project.value
  };

  const dialogCloseHandler = () => {
    if (!loading) {
      close();
    }
  };

  const submitHandler = async (values) => {
    setEditLoading(true);
    const result = await dispatch(editProject(project, values));
    setEditLoading(false);
    if (result) {
      formik.setValues(initialValues);
      close();
    }
  };

  const newCommentHandler = async (values) => {
    setCommentLoading(true);
    const result = await dispatch(addComment(project, values));
    setCommentLoading(false);
    return result;
  };

  const commentLikeClickHandler = async (reverseIndex) => {
    //Comments get reversed to display newest first, need to switch it back
    const index = project.comments.length - reverseIndex - 1;
    const newProject = new Project({ ...project });
    await newProject.toggleCommentLike(index);
  };

  const formik = useFormik({
    initialValues: initialValues,
    onSubmit: submitHandler,
    validationSchema: validationSchema
  });

  const { validateForm } = formik;

  useEffect(() => {
    validateForm();
    setValidatedOnMount(true);
  }, [validateForm]);

  const customerRenderInput = (params) => (
    <TextField
      {...params}
      label='Customer'
      fullWidth
      helperText={
        formik.errors.customer && formik.touched.customer
          ? formik.errors.customer
          : null
      }
      FormHelperTextProps={{
        style: {
          color: props.theme.palette.error.main
        }
      }}
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <Fragment>
            {customersLoading ? (
              <CircularProgress color='inherit' size={20} />
            ) : null}
            {params.InputProps.endAdornment}
          </Fragment>
        )
      }}
    />
  );

  const customerFilterOptions = (options, params) => {
    const filtered = filter(options, params);
    if (customers) {
      const customerExists = customers.find(
        (customer) =>
          customer.name.trim().toLowerCase() ===
          params.inputValue.trim().toLowerCase()
      );
      if (params.inputValue !== '' && !customerExists) {
        filtered.push({
          inputValue: params.inputValue,
          name: `Add "${params.inputValue}"`
        });
      }
    }
    return filtered;
  };

  const customerChangeHandler = async (_event, value) => {
    let newValue;
    if (value?.inputValue) {
      setCustomerAdding(true);
      const newCustomerName = value.inputValue.trim();
      const newCustomer = new Customer({ name: newCustomerName });
      await newCustomer.save();
      newValue = newCustomer;
      setCustomerAdding(false);
    } else {
      newValue = new Customer({ ...value });
    }
    formik.setFieldValue('customer', newValue, true);
  };

  const vendorRenderInput = (params) => (
    <TextField
      {...params}
      label='Vendors'
      fullWidth
      helperText={
        formik.errors.vendors && formik.touched.vendors
          ? formik.errors.vendors
          : null
      }
      FormHelperTextProps={{
        style: {
          color: props.theme.palette.error.main
        }
      }}
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <Fragment>
            {vendorsLoading ? (
              <CircularProgress color='inherit' size={20} />
            ) : null}
            {params.InputProps.endAdornment}
          </Fragment>
        )
      }}
    />
  );

  const vendorFilterOptions = (options, params) => {
    const filtered = filter(options, params);
    if (vendors) {
      const vendorExists = vendors.find(
        (vendor) =>
          vendor.name.trim().toLowerCase() ===
          params.inputValue.trim().toLowerCase()
      );
      if (params.inputValue !== '' && !vendorExists) {
        filtered.push({
          inputValue: params.inputValue,
          name: `Add "${params.inputValue}"`
        });
      }
    }
    return filtered;
  };

  const vendorChangeHandler = async (_event, value) => {
    let newValue = [...value];
    const newVendorIndex = newValue.findIndex((value) => value.inputValue);
    if (newVendorIndex !== -1) {
      setVendorAdding(true);
      const newVendorName = newValue[newVendorIndex].inputValue.trim();
      const newVendor = new Vendor({ name: newVendorName });
      await newVendor.save();
      newValue.splice(newVendorIndex, 1, newVendor);
      setVendorAdding(false);
    }
    formik.setFieldValue('vendors', newValue, true);
  };

  const ownersRenderInput = (params) => (
    <TextField
      {...params}
      label='Owners'
      fullWidth
      helperText={
        formik.errors.owners && formik.touched.owners
          ? formik.errors.owners
          : null
      }
      FormHelperTextProps={{
        style: {
          color: props.theme.palette.error.main
        }
      }}
    />
  );

  const ownersRenderOption = (option, _state) => (
    <Grid container direction='row' spacing={2}>
      <Grid item>
        <ListItemAvatar>
          <Avatar user={option} />
        </ListItemAvatar>
      </Grid>
      <Grid item>
        <ListItemText primary={option.getFullName()} />
      </Grid>
    </Grid>
  );

  return (
    <Dialog open={open} onClose={dialogCloseHandler} fullWidth maxWidth='sm'>
      <DialogTitle>Edit Project</DialogTitle>
      <DialogContent style={{ overflowY: 'auto' }}>
        <Grid container direction='column' spacing={2}>
          <Grid item>
            <TextField
              label='Project Name'
              fullWidth
              value={formik.values.name}
              onChange={formik.handleChange('name')}
              onBlur={formik.handleBlur('name')}
              autoFocus
              helperText={
                formik.errors.name && formik.touched.name
                  ? formik.errors.name
                  : null
              }
              FormHelperTextProps={{
                style: {
                  color: props.theme.palette.error.main
                }
              }}
            />
          </Grid>
          <Grid item>
            <TextField
              label='Description'
              fullWidth
              multiline
              rows={3}
              rowsMax={3}
              value={formik.values.description}
              onChange={formik.handleChange('description')}
              onBlur={formik.handleBlur('description')}
              helperText={
                formik.errors.description && formik.touched.description
                  ? formik.errors.description
                  : null
              }
              FormHelperTextProps={{
                style: {
                  color: props.theme.palette.error.main
                }
              }}
            />
          </Grid>
          <Grid item container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                filterSelectedOptions
                openOnFocus
                loading={customersLoading}
                onOpen={() => setCustomersOpen(true)}
                onClose={() => setCustomersOpen(false)}
                options={customers || []}
                getOptionLabel={(option) => option.name}
                getOptionSelected={(option, value) =>
                  option.customerId === value.customerId
                }
                value={formik.values.customer}
                onChange={customerChangeHandler}
                onBlur={formik.handleBlur('customer')}
                filterOptions={customerFilterOptions}
                renderInput={customerRenderInput}
              />
            </Grid>
            <Grid item xs={6}>
              <Autocomplete
                multiple
                filterSelectedOptions
                disableCloseOnSelect
                openOnFocus
                loading={vendorsLoading}
                onOpen={() => setVendorsOpen(true)}
                onClose={() => setVendorsOpen(false)}
                options={vendors || []}
                getOptionLabel={(option) => option.name}
                getOptionSelected={(option, value) =>
                  option.vendorId === value.vendorId
                }
                value={formik.values.vendors}
                onChange={vendorChangeHandler}
                onBlur={formik.handleBlur('vendors')}
                filterOptions={vendorFilterOptions}
                renderInput={vendorRenderInput}
              />
            </Grid>
          </Grid>
          <Grid item container spacing={2}>
            <Grid item xs={6}>
              <Autocomplete
                multiple
                filterSelectedOptions
                disableCloseOnSelect
                openOnFocus
                options={users}
                getOptionLabel={(option) => option.getFullName()}
                getOptionSelected={(option, value) =>
                  option.userId === value.userId
                }
                value={formik.values.owners}
                onChange={(_event, value) => {
                  const fixedOwners = initialValues.owners.filter(
                    (owner) => owner.userId !== authUser.userId
                  );
                  const newValue = [
                    ...fixedOwners,
                    ...value.filter(
                      (option) => fixedOwners.indexOf(option) === -1
                    )
                  ];
                  formik.setFieldValue('owners', newValue, true);
                }}
                onBlur={formik.handleBlur('owners')}
                renderInput={ownersRenderInput}
                renderOption={ownersRenderOption}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Status'
                select={true}
                fullWidth={true}
                value={formik.values.status}
                onChange={formik.handleChange('status')}
                onBlur={formik.handleBlur('status')}
                helperText={
                  formik.errors.status && formik.touched.status
                    ? formik.errors.status
                    : null
                }
                FormHelperTextProps={{
                  style: {
                    color: props.theme.palette.error.main
                  }
                }}
              >
                {projectStatusTypes.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid item container spacing={2}>
            <Grid item xs={6}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <DatePicker
                  label='Reminder date'
                  value={formik.values.reminder}
                  onChange={(value) => formik.setFieldValue('reminder', value)}
                  onBlur={formik.handleBlur('reminder')}
                  format={LONG_DATE}
                  fullWidth={true}
                  helperText={
                    formik.errors.reminder && formik.touched.reminder
                      ? formik.errors.reminder
                      : null
                  }
                  FormHelperTextProps={{
                    style: {
                      color: props.theme.palette.error.main
                    }
                  }}
                />
              </MuiPickersUtilsProvider>
            </Grid>
            <Grid item xs={6}>
              <TextField
                type='number'
                label='Estimated value'
                fullWidth
                value={formik.values.value}
                onChange={formik.handleChange('value')}
                onBlur={formik.handleBlur('value')}
                helperText={
                  formik.errors.value && formik.touched.value
                    ? formik.errors.value
                    : null
                }
                FormHelperTextProps={{
                  style: {
                    color: props.theme.palette.error.main
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>$</InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <ActionsBar
          notifications={{
            enabled: true,
            readOnly: true,
            tooltip: 'All project owners will be notified automatically'
          }}
          attachments={{
            enabled: true,
            attachments: formik.values.attachments,
            setAttachments: (attachments) =>
              formik.setFieldValue('attachments', attachments)
          }}
          comments={{
            enabled: true,
            comments: project.comments,
            clickHandler: () => setShowComments((prevState) => !prevState)
          }}
          buttonLoading={editLoading}
          disabled={loading || !validatedOnMount}
          isValid={formik.isValid}
          onClick={formik.handleSubmit}
          tooltipPlacement='top'
          actionButtonText='Update'
        />
      </DialogActions>
      <Collapse in={showComments} timeout='auto'>
        <Comments
          collection='projects'
          submitHandler={newCommentHandler}
          comments={[...project.comments].reverse()}
          actionBarNotificationProps={{
            enabled: true,
            tooltip: 'All project owners will be notified',
            readOnly: true
          }}
          commentLikeClickHandler={commentLikeClickHandler}
        />
      </Collapse>
    </Dialog>
  );
});

export default EditProjectDialog;
