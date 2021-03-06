const mongoose = require('mongoose');
const IP2Region = require('ip2region').default;
const query = new IP2Region();
const ipRegion = require('../controllers/ipRegionController');

const accesserSchema = new mongoose.Schema(
	{
		name: {
			type: Number,
			unique: true,
		},
		level: {
			type: String,
			trim: true,
		},
		country: String,
		province: String,
		city: String,
		isp: String,
		isRobot: Boolean,
		deviceInfo: String,
		brower: String,
		status: Number,
		ts: Date,
		duration: Number,
		size: Number,
		common_log: {
			type: String,
			trim: true,
		},
		proto: {
			type: String,
			trim: true,
		},
		method: {
			type: String,
			trim: true,
		},
		host: {
			type: String,
			trim: true,
		},
		url: {
			type: String,
			trim: true,
		},
		User_Agent: {
			type: Array,
			default: ['robot'],
		},
		req_headers: {
			type: Object,
		},
		resp_headers: {
			type: Object,
		},
		remote_addr: {
			type: String,
			required: [true, 'An accesser must have a IP'],
		},
		relegation: {
			type: Object,
			// required: [true, 'An accesser must have IPRegin'],
		},
		locations: [
			{
				type: {
					type: String,
					default: 'Point',
					enum: ['Point'],
				},
				coordinates: [Number],
				address: String,
				description: String,
			},
		],
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);
// virtual populate
accesserSchema.virtual('reviews', {
	ref: 'Review',
	foreignField: 'accesser',
	localField: '_id',
});

accesserSchema.pre('save', async function (next) {
	const regex = ['谷歌'];
	// eslint-disable-next-line no-useless-escape
	const regx = /^([\w\/\-\.\s]+)\(?([\w\s\.\;\+\/\,\:]+)?\)?([\w\/\-\.\s]+)?\(?([\w\s\.\;\+\/\,\:]+)?\)?([\w\/\-\.\s]+)?\(?([\w\s\.\;\+\/\,\:]+)?\)?([\w\/\-\.\s]+)?$/g;
	this.User_Agent[0].match(regx);
	if (RegExp.$2) {
		this.deviceInfo = RegExp.$2;
	}
	if (RegExp.$5) {
		this.brower = RegExp.$5;
	}
	let a = await ipRegion.getIpRegion(this.remote_addr);
	a.status === 'success'
		? (this.relegation = a)
		: (this.relegation = query.search(this.remote_addr));

	this.country = this.relegation.country;
	this.province = this.relegation.country;
	this.city = this.relegation.city;
	this.isp = this.relegation.isp;
	this.isRobot = regex.some((element) => {
		return this.isp === element;
	});
	next();
});

accesserSchema.pre(/^find/, function (next) {
	this.find({ isRobot: { $ne: true } });
	this.start = Date.now();
	next();
});

// accesserSchema.post(/^find/, function (doc, next) {
// 	console.log(`Query took ${Date.now() - this.start} milliseconds!`);
// 	next();
// });

accesserSchema.pre('aggregate', function (next) {
	this.pipeline().unshift({ $match: { isRobot: { $ne: true } } });
	next();
});

const Accesser = mongoose.model('Accesser', accesserSchema);

module.exports = Accesser;
