import { SUBMITTED } from '../data/expense-claim-status-types';
import firebase, { getServerTimeInMilliseconds } from '../utils/firebase';

export default class ExpenseClaim {
	constructor({
		expenseClaimId,
		actions,
		attachments,
		comments,
		expenses,
		manager,
		metadata,
		user
	}) {
		this.expenseClaimId = expenseClaimId;
		this.actions = actions;
		this.attachments = attachments;
		this.comments = comments;
		this.expenses = expenses;
		this.manager = manager;
		this.metadata = metadata;
		this.user = user;
	}

	getDatabaseObject() {
		const databaseObject = { ...this };
		delete databaseObject.expenseClaimId;
		return databaseObject;
	}

	static async isAdmin() {
		const docRef = await firebase
			.firestore()
			.collection('permissions')
			.doc('expense-claims')
			.collection('admins')
			.doc(firebase.auth().currentUser.uid)
			.get();
		return docRef.exists;
	}

	static getListener(expenseClaimId) {
		return firebase
			.firestore()
			.collection('expense-claims')
			.doc(expenseClaimId);
	}

	async save() {
		const serverTime = await getServerTimeInMilliseconds();
		if (!this.expenseClaimId) {
			this.metadata = {
				createdAt: new Date(serverTime),
				createdBy: firebase.auth().currentUser.uid,
				updatedAt: new Date(serverTime),
				updatedBy: firebase.auth().currentUser.uid
			};
			this.actions = [
				{
					actionType: SUBMITTED,
					actionedAt: new Date(serverTime),
					actionedBy: firebase.auth().currentUser.uid
				}
			];
			const docRef = await firebase
				.firestore()
				.collection('expense-claims')
				.add(this.getDatabaseObject());
			this.expenseClaimId = docRef.id;
		}
	}
}