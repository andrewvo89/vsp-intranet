import { CircularProgress, Container, Grid } from '@material-ui/core';
import { Pagination } from '@material-ui/lab';
import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import CollectionData from '../../models/collection-data';
import { READ_PAGE, READ_PRODUCT_REQUEST } from '../../utils/actions';
import ProductRequestCard from './ProductRequestCard';
import AddIcon from '@material-ui/icons/Add';
import FloatingActionButton from '../../components/FloatingActionButton';
import NewProductRequestDialog from './NewProductRequestDialog';
import ProductRequest from '../../models/product-request';

const ProductRequests = (props) => {
  const { authUser } = useSelector((state) => state.authState);
  const { userId } = authUser;
  const dispatch = useDispatch();

  const params = useParams();
  const { action } = props;
  const { replace, push } = useHistory();

  const initialPage = 1;
  const MAX_PER_PAGE = 5;

  const [collectionData, setCollectionData] = useState();
  const [dataSource, setDataSource] = useState();

  const [page, setPage] = useState(initialPage);
  const [productRequestIds, setProductRequestIds] = useState();
  const [activeProductRequestId, setActiveProductRequestId] = useState(null);

  const [permissions, setPermissions] = useState();
  const [
    showNewProductRequestDialog,
    setShowNewProductRequestDialog
  ] = useState(false);

  //Mount and dismount, get admin status
  useEffect(() => {
    const asyncFunction = async () => {
      const newPermissions = await ProductRequest.getPermissions();
      setPermissions(newPermissions);
    };
    asyncFunction();
  }, []);
  //Get product requests based on user
  useEffect(() => {
    let collectionDataListener;
    const asyncFunction = async () => {
      let listenerRef;
      if (permissions.admins) {
        //Get all documents
        listenerRef = CollectionData.getListener('product-requests');
      } else {
        //Get only documents where the user has ownership
        listenerRef = CollectionData.getNestedListener({
          document: 'product-requests',
          subCollection: 'users',
          subCollectionDoc: userId
        });
      }
      collectionDataListener = listenerRef.onSnapshot((snapshot) => {
        let newCollectionData = new CollectionData({
          collection: 'product-requests',
          documents: []
        });
        if (snapshot.exists) {
          newCollectionData = new CollectionData({
            ...snapshot.data(),
            collection: snapshot.id
          });
        }
        setCollectionData(newCollectionData);
      });
    };
    if (permissions !== undefined) {
      asyncFunction();
    }
    return () => {
      if (collectionDataListener) {
        collectionDataListener();
      }
    };
  }, [dispatch, permissions, userId]);
  //If results change or collectionData changes, update the data source
  useEffect(() => {
    if (collectionData) {
      let newDataSource = [...collectionData.documents].reverse();
      setDataSource(newDataSource);
    }
  }, [collectionData]);
  //When a new change in the data source is detected
  useEffect(() => {
    if (dataSource) {
      let newPage = initialPage;
      if (action === READ_PAGE) {
        //Common case
        const pageNumber = parseInt(params.page);
        const lastPage = Math.ceil(dataSource.length / MAX_PER_PAGE);
        //lastPage === 0, means there are no records
        if ((pageNumber > 0 && pageNumber <= lastPage) || lastPage === 0) {
          newPage = pageNumber;
        } else {
          newPage = initialPage;
          replace(`/product-requests/page/${initialPage}`);
        }
      } else if (action === READ_PRODUCT_REQUEST) {
        //Coming from direct link
        const productRequestId = params.productRequestId;
        const index = dataSource.findIndex(
          (document) => document === productRequestId
        );
        if (index !== -1) {
          newPage = Math.floor(index / MAX_PER_PAGE) + 1;
          const newActiveProductRequestId = productRequestId;
          setActiveProductRequestId(newActiveProductRequestId);
        } else {
          newPage = initialPage;
          replace(`/product-requests/page/${initialPage}`);
        }
      }
      //Slicing the data source to only include 5 results
      const START_INDEX = newPage * MAX_PER_PAGE - MAX_PER_PAGE;
      const END_INDEX = START_INDEX + MAX_PER_PAGE;
      const newProductRequestIds = dataSource.slice(START_INDEX, END_INDEX);
      setPage(newPage);
      setProductRequestIds(newProductRequestIds);
    }
  }, [dataSource, action, params, replace]);

  if (!productRequestIds) {
    return <CircularProgress />;
  }

  const count = Math.ceil(dataSource.length / MAX_PER_PAGE);

  return (
    <Fragment>
      <NewProductRequestDialog
        open={showNewProductRequestDialog}
        close={() => setShowNewProductRequestDialog(false)}
      />
      <Container disableGutters maxWidth='sm'>
        <Grid container direction='column' spacing={2}>
          <Grid item container direction='column' spacing={2}>
            {productRequestIds.map((productRequestId) => {
              const scroll = activeProductRequestId === productRequestId;
              return (
                <Grid item key={productRequestId}>
                  <ProductRequestCard
                    productRequestId={productRequestId}
                    setActiveProductRequestId={setActiveProductRequestId}
                    scroll={scroll}
                    permissions={permissions}
                  />
                </Grid>
              );
            })}
            {dataSource.length > 0 && (
              <Grid item container direction='row' justify='center'>
                <Pagination
                  color='primary'
                  count={count}
                  page={page}
                  onChange={(_event, value) =>
                    push(`/product-requests/page/${value.toString()}`)
                  }
                  showFirstButton={true}
                  showLastButton={true}
                />
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>
      <FloatingActionButton
        style={{ zIndex: 100 }}
        color='primary'
        tooltip='Add Product Request'
        onClick={() => setShowNewProductRequestDialog(true)}
      >
        <AddIcon />
      </FloatingActionButton>
    </Fragment>
  );
};

export default ProductRequests;
