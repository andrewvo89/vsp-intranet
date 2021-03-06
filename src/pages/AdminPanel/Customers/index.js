import { Paper } from '@material-ui/core';
import MaterialTable from 'material-table';
import React, { Fragment, useEffect, useState } from 'react';
import FloatingActionButton from '../../../components/FloatingActionButton';
import tableIcons from '../../../utils/table-icons';
import columnSchema from './column-schema';
import AddIcon from '@material-ui/icons/Add';
import UploadCustomersDialog from './UploadCustomersDialog';
import Customer from '../../../models/customer';

const FlatContainer = (props) => (
  <Paper {...props} variant='outlined' style={{ border: 0 }} />
);

const Customers = (props) => {
  const [customers, setCustomers] = useState();
  const [showUploadCustomersDialog, setShowUploadCustomersDialog] = useState(
    false
  );

  useEffect(() => {
    let customersListener = Customer.getExternalListener().onSnapshot(
      (snapshot) => {
        const newCustomers = snapshot.docs.map((doc) => ({
          customerId: doc.id,
          ...doc.data()
        }));
        setCustomers(newCustomers);
      }
    );
    return () => {
      if (customersListener) {
        customersListener();
      }
    };
  }, []);

  return (
    <Fragment>
      <UploadCustomersDialog
        open={showUploadCustomersDialog}
        close={() => setShowUploadCustomersDialog(false)}
        customers={customers}
      />
      <MaterialTable
        isLoading={!customers}
        icons={tableIcons}
        columns={columnSchema}
        data={customers}
        options={{
          showTitle: false,
          paginationType: 'normal',
          minBodyHeight: window.innerHeight / 1.5,
          maxBodyHeight: window.innerHeight / 1.5,
          pageSize: 10,
          pageSizeOptions: [10, 20, 50, 100, 500, 1000]
        }}
        components={{
          Container: FlatContainer
        }}
      />
      <FloatingActionButton
        style={{ zIndex: 100 }}
        color='primary'
        tooltip='Upload Customers'
        onClick={() => setShowUploadCustomersDialog(true)}
      >
        <AddIcon />
      </FloatingActionButton>
    </Fragment>
  );
};

export default Customers;
