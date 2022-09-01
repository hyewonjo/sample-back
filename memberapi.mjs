import express from "express";
import jwt from "jsonwebtoken";
import config from "./config.mjs";

const router = express.Router();

let memberList = [
    {id:"testid1", password:"testpwd1", name:"홍길동", refreshToken: ""},
    {id:"testid2", password:"testpwd2", name:"김철수", refreshToken: ""},
    {id:"testid3", password:"testpwd3", name:"이영희", refreshToken: ""}];

async function createAccessToken(memberItem) {
    return await new Promise((resolve, reject) => {
        jwt.sign({
                memberId: memberItem.id,
                memberName: memberItem.name
            },
            config.secret,
            {
                expiresIn: '10m'
            },
            (err, token) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(token);
                }
            });
    });
}

router.post('/login', async function(req, res, next) {
    console.log("REST API Post Method - Member Login And JWT Sign");
    const memberId = req.body.id;
    const memberPassword = req.body.password;

    const memberItem = memberList.find(object => object.id === memberId);
    if (memberItem != null) {
        if (memberItem.password === memberPassword) {
            try {
                /*
                JavaScript의 비동기 처리로 인해 callback이 호출되기 전에 처리가 완료될 수 있습니다. 그래서 jwt.sign() 메서드를 Promise로 처리하고 async와 await로 동기 처리되게 해야 합니다.
                 */
                const accessToken = await createAccessToken(memberItem);

                const refreshToken = await new Promise((resolve, reject) => {
                    jwt.sign({
                            memberId : memberItem.id
                        },
                        config.secret,
                        {
                            expiresIn : '1d' // 로그인 유지하고싶은 만큼 설정
                        },
                        (err, token) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(token);
                            }
                        });
                });

                res.json({success: true, accessToken: accessToken, refreshToken: refreshToken});
            } catch(err) {
                console.error(err);
                res.status(401).json({success:false, errormessage:'token sign fail'});
            }
        } else {
            res.status(401).json({success:false, errormessage:'id and password are not identical'});
        }
    } else {
        res.status(401).json({success:false, errormessage:'id and password are not identical'});
    }
});

router.post('/refresh', async (req, res, next) => {
    console.log("REST API Post Method - Member JWT Refresh");

    // 1. 존재하는 사용자인지 db select
    // 요청값으로 받은 memberId로 체크
    const memberId = req.body.id;
    const memberItem = memberList.find(member => member.id === memberId);

    if (memberItem == null)
        return res.status(401).json({success:false, errormessage: 'id is not identical'});

    const refreshToken = req.body.refreshToken;
    if (memberItem.refreshToken !== refreshToken)
        return res.status(401).json({success:false, errormessage: 'Token is not identical'});

    // 2. refreshToken이 유효한지 검증
    let decodedRefreshToken;
    try {
        decodedRefreshToken = await new Promise((resolve, reject) => {
            jwt.verify(refreshToken, config.secret, (err, decoded) => {
                if (err)
                    reject(err);
                else
                    resolve(decoded);
            });
        });
    } catch(err) {
        return res.status(401).json({success:false, errormessage: 'Refresh-Token has expired or invalid signature'});
    }

    if (decodedRefreshToken.memberId !== memberId)
        return res.status(401).json({success:false, errormessage: 'Token is not identical'});

    // 3. accessToken 재발급 (만료여부는 굳이 체크하지않는다)
    const accessToken = req.body.accessToken;

    // decode가 되는 accessToken인지는 확인한다.
    let decodedAccessToken;
    try {
        decodedAccessToken = await new Promise((resolve, reject) => {
            jwt.verify(accessToken, config.secret, {ignoreExpiration: true}, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });
    } catch(err) {
        return res.status(401).json({success:false, errormessage: 'Access-Token is invalid signature'});
    }

    if (decodedAccessToken.memberId !== memberId)
        return res.status(401).json({success:false, errormessage: 'Token is not identical'});

    const newAccessToken = await createAccessToken({memberItem});

    return res.json({success:true, accessToken: newAccessToken})
});

export default router;