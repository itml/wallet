import Request from '../utils/RequestUtil';
import {getBalance, listAssets, addAssetToServer, getActions, getActions2, fetchAssetsByAccount} from '../utils/Api';
import store from 'react-native-simple-store';
import { EasyToast } from '../components/Toast';
import { DeviceEventEmitter } from 'react-native';
import Constants from '../utils/Constants'
export default {
    namespace: 'assets',
    state: {
        assetsData:{},
        newsRefresh:false,
        updateTime:"",
        tradeLog:{},
    },
    effects: {
      *list({payload, callback},{call,put}) {
        try{
            if(payload.page==1){
                yield put({type:'upstatus',payload:{newsRefresh:true}});
            }
            const resp = yield call(Request.request, listAssets, 'post', payload);
            // alert(JSON.stringify(resp));
            if(resp.code=='0'){
                let dts = new Array();
                resp.data.map((item)=>{
                    if(item.name != 'EOS'){  // EOS不显示在列表中
                        item.row=3;
                        dts.push(item);
                    }
                });
                yield put({type:'updateAssetList',payload:{assetsList:dts,...payload}});
            }else{
                EasyToast.show(resp.msg);
            }
            yield put({type:'upstatus',payload:{newsRefresh:false}});
        } catch (error) {
            yield put({type:'upstatus',payload:{newsRefresh:false}});
            EasyToast.show('网络繁忙,请稍后!');
        }
        if(callback) callback("");
      },
      *submitAssetInfoToServer({payload, callback},{call,put}){
        try{
            const resp = yield call(Request.request, addAssetToServer, 'post', {contract_account: payload.contractAccount, name: payload.name});
            if(resp && resp.code=='0'){
                DeviceEventEmitter.emit('updateAssetList', payload);
            }
            if(callback){
                callback(resp);
            }
        }catch(e){
            EasyToast.show('网络繁忙,请稍后!');
        }
     },
     *myAssetInfo({payload, callback},{call,put}){
        var isPriceChange = false; // 价格是否改变
        var myAssets = yield call(store.get, 'myAssets217_' + payload.accountName);

        if(myAssets == null || myAssets.length == 0){ // 未有资产信息时默认取eos的
            var myAssets = [];
            // 单独获取eos信息
            var eosInfoDefault = {
                asset: {name : "EOS", icon: "http://static.eostoken.im/images/20180319/1521432637907.png", contractAccount: "eosio.token", value: "0.00"},
                value: true,
                balance: '0.0000',
            }
            myAssets[0] = eosInfoDefault;
            var currentAccount = yield call(store.get, 'current_account');
            if(payload && payload.isInit && currentAccount == payload.accountName){
                yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
            }
            var resp;
            try {
                resp = yield call(Request.request, listAssets, 'post', {code: 'EOS'});
                if(respresp.code == '0' && resp.data && resp.data.length == 1){
                    var eosInfo = {
                        asset: resp.data[0],
                        value: true,
                        balance: '0.0000',
                    }
                    myAssets[0] = eosInfo;
                }
            } catch (error) {

            }

            var currentAccount = yield call(store.get, 'current_account');
            if(currentAccount == payload.accountName){
                yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
            }
        }else{
            var currentAccount = yield call(store.get, 'current_account');
            if(payload && payload.isInit && currentAccount == payload.accountName){
                yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
            }
            try{
                for(var i = 0; i < myAssets.length; i++){
                    const resp = yield call(Request.request, listAssets, 'post', {code: myAssets[i].asset.name});
                    if(resp.code == '0' && resp.data && resp.data.length == 1){
                        var assetInfo = {
                            asset: resp.data[0],
                            value: true,
                            balance: myAssets[i].balance,
                        }
                        if(resp.data[0].value != myAssets[i].asset.value){
                            isPriceChange = true;
                        }
                        myAssets[i] = assetInfo;
                    }
                }
            }catch(e){

            }

        }

        // alert("myAssetInfo" +JSON.stringify(myAssets));
        // 

        var currentAccount = yield call(store.get, 'current_account');
        if((currentAccount == payload.accountName)){
            yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);
            yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
        }
        if(isPriceChange){
            DeviceEventEmitter.emit('updateMyAssetsPrice', myAssets);
        }

        if(callback){
            callback(myAssets);
        }

    },
    *getBalance({payload, callback}, {call, put}){
        try{
            // alert("------ " + JSON.stringify(payload));
            var myAssets = yield call(store.get, 'myAssets217_' + payload.accountName);
            var isBalanceChange = false;
            for(let i in myAssets){
                let item = myAssets[i];
                var accountName = yield call(store.get, 'accountName');
                if(accountName == null || payload.accountName != accountName){ // 切换用户后
                    isBalanceChange = true;
                    item.balance = '0.0000';
                }
                const resp = yield call(Request.request, getBalance, 'post', {contract: item.asset.contractAccount, account: payload.accountName, symbol: item.asset.name});
                // alert("------ " + JSON.stringify(resp));
                if(resp && resp.code=='0' && resp.data != null){
                    if(resp.data != item.balance){
                        isBalanceChange = true;
                        item.balance = resp.data;
                    }
                }
            }

            if(isBalanceChange){
                    yield call(store.save, 'accountName', payload.accountName);
                    yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);

                    var currentAccount = yield call(store.get, 'current_account');
                    if(currentAccount == payload.accountName){
                        yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
                    }

                DeviceEventEmitter.emit('updateMyAssetsBalance', payload);
            }

            if(callback){
                callback(payload.myAssets);
            }
        }catch(e){
            EasyToast.show('网络繁忙,请稍后!');
        }
    },
    *clearBalance({payload, callback}, {call, put}){
        var myAssets = yield call(store.get, 'myAssets217_' + payload.accountName);
        for(let i in myAssets){
            let item = myAssets[i];
            item.balance = '0.0000';
        }
        yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);
        var currentAccount = yield call(store.get, 'current_account');
        if(currentAccount == payload.accountName){
            yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
        }
        if(callback) callback();
    },
    *addMyAsset({payload, callback},{call,put}){
        var myAssets = yield call(store.get, 'myAssets217_' + payload.accountName);
        // alert(JSON.stringify(payload.asset) + "   " +JSON.stringify(myAssets));
        if (myAssets == null) {
            var  myAssets = [];
        }
        for (var i = 0; i < myAssets.length; i++) {
            if (myAssets[i].asset.name == payload.asset.name) {
                if(payload.value){ // 添加资产,  但资产已存在
                    if(callback) callback(myAssets);
                    return;
                }else{ // 删除资产
                    myAssets.splice(i, 1);
                    yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);
                    // alert("delMyAsset" +JSON.stringify(myAssets));
                    var currentAccount = yield call(store.get, 'current_account');
                    if(currentAccount == payload.accountName){
                        yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
                    }
                    if(callback) callback(myAssets);
                    return;
                }
            }
        }

        // 如果目前我的资产没有传入的资产
        if(!payload.value){ // 删除资产直接退出
            if(callback) callback(myAssets);
            return;
        }

        // 添加资产
        var _asset = {
            asset: payload.asset,
            value: true,
            balance: '0.0000',
        }
        myAssets[myAssets.length] = _asset;
        yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);
        // alert("addMyAsset" +JSON.stringify(myAssets));
        var currentAccount = yield call(store.get, 'current_account');
        if(currentAccount == payload.accountName){
            yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
        }
        if(callback) callback(myAssets);
     },
     *fetchMyAssetsFromNet({payload, callback},{call,put}) {
        if(payload && payload.accountName){
            var myAssets = yield call(store.get, 'myAssets217_' + payload.accountName);

            try{
                // const resp = {"msg":"success","data":["EOS","MSP","ADD","EETH"], "code":"0"};
                const resp = yield call(Request.request, fetchAssetsByAccount + payload.accountName, "get");
                if(resp && resp.code == '0' && resp.data){
                    for(var i = 0; i < resp.data.length; i++){
                        for(var j = 0; j < myAssets.length; j++){
                            if(myAssets[j].asset.name == resp.data[i]){ // 已经在资产列表中
                                break;
                            }
                        }
                        if(j == myAssets.length){ // 列表还没有该资产
                            resp1 = yield call(Request.request, listAssets, 'post', {code: resp.data[i]});
                            if(resp1 && resp1.code == '0' && resp1.data && resp1.data.length == 1){
                                var eosInfo = {
                                    asset: resp1.data[0],
                                    value: true,
                                    balance: '0.0000',
                                }
                                myAssets[myAssets.length] = eosInfo;
                            }                        
                        }
                    }

                    yield call(store.save, 'myAssets217_' + payload.accountName, myAssets);

                    var currentAccount = yield call(store.get, 'current_account');
                    if(currentAccount == payload.accountName){ // 异步原因，可能钱包已切换
                        yield put({ type: 'updateMyAssets', payload: {myAssets: myAssets} });
                    }
                }
                
            } catch (error) {

            }

            if(callback) callback();
        }
     },
     *clearTradeDetails({payload, callback},{call,put}) {
        try{
            yield put({ type: 'clearDetails', payload: { data:null, ...payload } });
        } catch (error) {

        }
     },
     *getTradeDetails({payload, callback},{call,put}) {
        try{
            const resp = yield call(Request.request, getActions2, "post", payload);
            if(resp && resp.code=='0'){       
                // alert(JSON.stringify(resp));
                yield put({ type: 'updateDetails', payload: { data:resp.data, ...payload } });
            }else{
                EasyToast.show(resp.msg);
            }
            if (callback) callback(resp);
            
        } catch (error) {
            EasyToast.show('网络繁忙,请稍后!');
            if (callback) callback({ code: 500, msg: "网络异常" });            
        }

     },
      *changeReveal({ payload,callback }, { call, put }) {
        var reveal = yield call(store.get, 'reveal');  
        // alert(JSON.stringify(reveal) );      
        if (reveal == null) {
            reveal = false;              
        }else{
            reveal = !reveal;
        }
        if (callback) callback({ reveal: reveal });
        yield call(store.save, 'reveal', reveal);
      },
      *getReveal({ payload,callback }, { call, put }) {
        var reveal = yield call(store.get, 'reveal');
        if (reveal == null) {
            reveal = true;  
            //没有记录要保存         
            yield call(store.save, 'reveal', reveal);
        }
        if (callback) callback({ reveal: reveal });
      },
      *setCurrentAccount({ payload,callback }, { call, put }) {
        if(payload && payload.accountName){
            yield call(store.save, 'current_account', payload.accountName);
        }
        if(callback) callback();
      },

    },

    reducers: {
        updateAssetList(state, action) {
            let assetsList = action.payload.assetsList;
            return {...state,assetsList,updateTime:Date.parse(new Date())};
        },
        upstatus(state,action){
            return {...state,...action.payload};
        },
        updateMyAssets(state, action) {
            let myAssets = action.payload.myAssets;
            if(myAssets == undefined || myAssets == null || myAssets.length == 0){
                return;
            }
            for(var i = 0; i < myAssets.length; i++){
                if(myAssets[i].asset.name != "EOS"){
                    continue;
                }

                var temp = myAssets[i];
                myAssets[i] = myAssets[0];
                myAssets[0] = temp;

                break;
            }
            // if(myAssets.length > 1){
            //     var tempA = [];
            //     tempA.push(myAssets[0]); // EOS为第一个元素，不进行排列
            //     myAssets.shift(); // 移除第一个元素，即EOS
            //     myAssets.sort(compare("balance")); // 根据余额进行排列
            //     myAssets = tempA.concat(myAssets); // EOS重新放在第一个元素
            // }

            return { ...state, myAssets, updateTime:Date.parse(new Date())};
        },
        updateDetails(state, action) {
            let tradeLog = state.tradeLog;
            if(action.payload.data == null || action.payload.last_id==-1 || tradeLog == null){
                tradeLog=action.payload.data;
            }else{
                tradeLog = tradeLog.concat(action.payload.data);
            }
            return {...state,tradeLog};
        },
        clearDetails(state, action) {
            let tradeLog = null;
            state.tradeLog = null;
            return { ...state, tradeLog };
        },
    }
  }
  
  function compare(property){
    return function(a,b){
        var value1 = a[property];
        var value2 = b[property];
        return value2 - value1;
    }
  }