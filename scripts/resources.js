// a defines for all resources
// TODO
// Resource List
var Resources = {
	"au": { 
		name: "Gold",
		value: 10,
	},
	"ag": { 
		name: "Silver",
		value: 5,
	},
	"fe": { 
		name: "Iron",
		value: 2,
	},
	"si": { 
		name: "Silicon",
		value: 4,
	},
	"h": { 
		name: "Hydrogen",
		value: 1,
	},
}

Resources.get_resources = function()
{
	var resources = {};
	for(key in Resources)
	{
		resources[key] = {count:0};
	}
	return resources;
},

module.exports = Resources;