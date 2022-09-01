import express from 'express';
import dateformat from 'dateformat';
import authMiddleware from './authmiddleware.mjs';

const router = express.Router();

let boardList = [
    {no:1, subject:"테스트 제목1", content:"테스트 내용1", writer:"testid1", writedate:"2021-08-09 13:00:00"},
    {no:2, subject:"테스트 제목2", content:"테스트 내용2", writer:"testid2", writedate:"2021-08-09 13:10:00"},
    {no:3, subject:"테스트 제목3", content:"테스트 내용3", writer:"testid3", writedate:"2021-08-09 13:20:00"}];

router.get('/', (req, res, next) => {
    console.log('REST API Get Method - Read All');
    res.json({success: true, data: boardList});
});

router.get('/:no', (req, res, next) => {
    const boardItem = boardList.find(object => object.no === parseInt(req.params.no, 10) );

    if (boardItem != null) {
        res.json({success: true, data: boardItem});
    } else {
        res.status(404);
        res.json({success: false, errormessage: 'not found'});
    }
});

router.post('/', authMiddleware, function(req, res, next) {
    console.log("REST API Post Method - Create");
    const boardLastItem = boardList.reduce((previous, current) => previous.no > current.no ? previous : current);
    const boardItem = {};
    boardItem.no = boardLastItem.no + 1;
    boardItem.subject = req.body.subject;
    boardItem.content = req.body.content;
    boardItem.writer = req.tokenInfo.memberId;
    boardItem.writedate = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");
    boardList.push(boardItem);
    res.json({success:true});
});

router.put('/:no', authMiddleware, function(req, res, next) {
    console.log("REST API Put Method - Update " + req.params.no);
    const boardItem = boardList.find(object => object.no === parseInt(req.params.no, 10));
    if (boardItem != null) {
        if (boardItem.writer !== req.tokenInfo.memberId)
            return res.status(403).json({success:false, errormessage:'id are not identical'});

        boardItem.subject = req.body.subject;
        boardItem.content = req.body.content;
        boardItem.writer = req.body.writer;
        boardItem.writedate = dateformat(new Date(), "yyyy-mm-dd HH:MM:ss");
        res.json({success:true});
    } else {
        res.status(404);
        res.json({success:false, errormessage:'not found'});
    }
});

router.delete('/:no', authMiddleware, function(req, res, next) {
    console.log("REST API Delete Method - Delete " + req.params.no);
    const boardItem = boardList.find(object => object.no === parseInt(req.params.no, 10));
    if (boardItem != null) {
        if (boardItem.writer !== req.tokenInfo.memberId)
            return res.status(403).json({success:false, errormessage:'id are not identical'});

        const index = boardList.indexOf(boardItem);
        if (index >= 0) {
            boardList.splice(index, 1)
            res.json({success:true});
        } else {
            res.status(404);
            res.json({success:false, errormessage:'not found'});
        }
    } else {
        res.status(404);
        res.json({success:false, errormessage:'not found'});
    }
});

export default router;