'use strict'

const request = require('request');
const async = require('async');
const logger = require('../utils/logger');
const reviewOption = { 
    url:'http://pennygold.kr/v3/gogold/consignment/list'
    // url:'https://pennygold.kr/v3/gogold/reviews'
};

const locationOption = {
  url:'https://pennygold.kr/v3/gogold/shared/location'
};

var imageUrl = "https://pennygold.kr/v3/common/files/view/";

const getConnection = require('../config/db');
let ytRet = {};

async function getYt(){
  const ytCnt = 4;
  const ytSql = "SELECT "+
                  "videoId, ID, channelId, title, description, channelTitle, playlistId, `position`, videoPublishedAt, thumnailMediumUrl, thumnailMaxResUrl, REG_DATETIME "+
                "FROM "+ 
                  "dbkorda.YOUTUBE_LIST "+
                "WHERE "+
                  "PLAYLISTID = 'PLdCdURyEGavxp8mQw-0jJNfC0bkBNKUI2' "+
                "ORDER BY "+ 
                  "dbkorda.YOUTUBE_LIST.`position` LIMIT "+ytCnt;
  getConnection((conn) => {
    conn.query(
      ytSql, function(err, rows) {
        ytRet = rows;
      }
    );
  });
}

let locations;
async function getLocationInfo(){
  return new Promise(function(resolve, reject){
    resolve(
        request(
          locationOption, 
            function(error, response, body) { 
                try {
                  locations = new Array();
                  let obj = JSON.parse(body);
                  // logger.info("JSON.parse(body):"+JSON.stringify(obj.data.서울));
                  locations.push(obj);
                } catch (err) {
                    logger.error(err);
                    throw err;
                }
            }
        )
    ).reject(new Error('fail')).catch(() => {if(!response.socket.destroyed) response.socket.destroy();});
  });
}

let reviews;
async function getReviewList() {
  return new Promise(function(resolve, reject){
      resolve(
          request(
            reviewOption, 
              function(error, response, body) { 
                  try {
                      reviews = new Array();
                      let result = JSON.parse(body);
                      for(let i=0;i<result.data.length;i++){
                        reviews.push(
                          // {
                          //   "categoryName":result.data[i].orderDto.orderItemList[0].categoryName,
                          //   "karatGrade":result.data[i].orderDto.orderItemList[0].decidedKaratGrade,
                          //   "totalWeight":result.data[i].reviewOtherDto.totalWeight,
                          //   "totalGoGoldKrw":new Intl.NumberFormat('ko-KR', { style: 'decimal', maximumFractionDigits: 2}).format(result.data[i].reviewOtherDto.totalGoGoldKrw),
                          //   "imageUrl":imageUrl+JSON.stringify(result.data[i].orderDto.orderItemList[0].image1),
                          //   "updatedAt":(result.data[i].orderDto.reviewList[0].updatedAt).split("T")[0]
                          // }
                          {
                            "title":result.data[i].title,
                            "statusString":result.data[i].statusString,
                            "price":result.data[i].price,
                            "imageUrl":imageUrl+JSON.stringify(result.data[i].image),
                            "updatedAt":result.data[i].updatedAt
                          }
                        );
                      }
                  } catch (err) {
                      logger.error(err);
                      throw err;
                  }
              }
          )
      ).reject(new Error('fail')).catch(() => {if(!response.socket.destroyed) response.socket.destroy();});
  });
}

let datum = {};
datum.getData = function (req, res){
    let ret = [];
    async.waterfall([
        // function(callback) {
        //     callback(null, initValue());
        // },
        function(callback) {
            callback(null, getYt());
        },
        function(arg, callback) {
            callback(null, getReviewList());
        },
        function(arg, callback) {
            callback(null, getLocationInfo());
        }
    ], function (err, result) {
        if(err){
            logger.error(err);
            res.socket.destroy();
            throw err;
        }else {
          res.set('Cache-Control', 'public, max-age=31557600');
          res.render('index', {reviewsRet:reviews, youTubes:ytRet, locations:locations, Buy24:0, Sell24:0, Sell18:0, Sell14:0});
            
        }  // 7
    });
};

module.exports = datum.getData;