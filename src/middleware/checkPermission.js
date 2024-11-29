// middleware/checkPermission.js
const User = require('../schemas/user.js');
const Role = require('../schemas/role.js');

const checkPermission = (resource, action) => {
    return async(req, res, next) => {
        const user_detail = req.cookies['user'];
        // console.log('user_detail : ', user_detail);
        // try {F
        const userId = user_detail._id; // Assuming user ID is stored in req.user
        // const user = await User.findById(userId).populate('role');
        // const role = await Role.findById(user.role._id).populate('permissions');
        const user1 = await User.findById(userId).populate({
            path: 'role',
            populate: {
                path: 'permissions'
            }
        });
        // console.log('role details : ', user1.role);

        if (user1.role.name != 'Admin') {
            const hasPermission = user1.role.permissions.some(
                perm => perm.resource === resource && perm.action === action
            );

            if (!hasPermission) {

                const user = req.cookies['user'];

                const success = req.flash('success');
                const danger = req.flash('danger');
                const info = req.flash('info');

                return res.status(200).render('pages/unauthorise', { user, success, danger, info, page_title: 'Un Authorise', page_url: 'unauthorise' });
            }
        }

        next();
        // } catch (error) {
        //     res.status(500).json({ message: 'Internal Server Error' });
        // }
    };
};

module.exports = checkPermission;