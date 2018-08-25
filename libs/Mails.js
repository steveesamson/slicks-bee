module.exports = {

	attributes: {
		id: 'int',
		sender_email: 'string',
		receiver_email: 'string',
		receiver_name: 'string',
		subject: 'string',
		body: 'string',
		type: 'string',
		sent: 'tinyint',
		created_time: 'string'
	},
	uniqueKeys: ['id'],
	searchPath: [],

};