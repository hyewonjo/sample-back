import jwt from 'jsonwebtoken';
import config from './config.mjs';

export default async(req, res, next) => {
    const accessToken = req.header('Access-Token');
    if (accessToken == null) {
        res.status(403).json({success: false, errormessage: 'Authentication fail'});
    } else {
        try {
            const tokenInfo = await new Promise((resolve, reject) => {
                jwt.verify(accessToken, config.secret,
                    (err, decoded) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(decoded);
                    }
                });
            });
            req.tokenInfo = tokenInfo;
            next();
        } catch(err) {
            console.error(err);
            res.status(403).json({success: false, errormessage: 'Authentication fail'});
        }
    }
};