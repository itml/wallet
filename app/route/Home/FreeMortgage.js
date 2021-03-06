import React from 'react';
import { connect } from 'react-redux'
import { Dimensions, DeviceEventEmitter, StyleSheet, Image, View, Text, Platform, Modal, Animated, TouchableOpacity, TextInput, Clipboard, ImageBackground, ScrollView, KeyboardAvoidingView } from 'react-native';
import UImage from '../../utils/Img'
import UColor from '../../utils/Colors'
import Header from '../../components/Header'
import ScreenUtil from '../../utils/ScreenUtil'
import { EasyToast } from "../../components/Toast"
import { EasyShowLD } from '../../components/EasyShow'
const ScreenWidth = Dimensions.get('window').width;
const ScreenHeight = Dimensions.get('window').height;
var dismissKeyboard = require('dismissKeyboard');

@connect(({ vote, wallet}) => ({ ...vote, ...wallet}))
class FreeMortgage extends React.Component {

  static navigationOptions = {
    title: 'EOS免费抵押',  
    header:null,  
  };
  
  constructor(props) {
    super(props);
    this.state = {
        show: false,
        labelname: (this.props.defaultWallet && this.props.defaultWallet.name) ? this.props.defaultWallet.name : '',
      }
  }

  //加载地址数据
  componentDidMount() {
    this.props.dispatch({ type: 'wallet/info', payload: { address: "1111" } });
    DeviceEventEmitter.addListener('scan_result', (data) => {
        if(data.toaccount){
            this.setState({labelname:data.toaccount})
        }
      });   
  }

  Scan() {
    const { navigate } = this.props.navigation;
    navigate('BarCode', {isTurnOut:true,coinType:"EOS"});
  }

  delegatebw() {
    try {
        if(this.state.labelname == null || this.state.labelname == ""){
            EasyToast.show("请输入账号");
            return;
        }
        //当前钱包账户，校验是否有激活
        if(this.props.defaultWallet && this.props.defaultWallet.name){
            if(this.state.labelname == this.props.defaultWallet.name){
                if(!this.props.defaultWallet.isactived || !this.props.defaultWallet.hasOwnProperty('isactived'))
                {
                    EasyToast.show("未检测有效的EOS账号, 请检查您当前账号是否有效!");
                    return;
                }
            }
        }
        // if (this.props.defaultWallet == null || this.props.defaultWallet.name == null || !this.props.defaultWallet.isactived || !this.props.defaultWallet.hasOwnProperty('isactived')) {
        //     EasyToast.show("未检测有效的EOS账号, 请检查您当前账号是否有效!");
        //     return;
        // }
        this.props.dispatch({type:'wallet/getFreeMortgage',payload:{username:this.state.labelname},callback:(resp)=>{ 
            if(resp.code == 601){
               EasyToast.show("您已经免费抵押过，把机会留给别人吧");
            }else{
                EasyShowLD.loadingShow();
                this.props.dispatch({type: "vote/delegatebw", payload: {username:this.state.labelname}, callback:(resp) =>{
                        EasyShowLD.dialogClose();
                        // alert(JSON.stringify(resp));
                        if(resp && resp.code=='0'){
                            EasyToast.show("恭喜您！已经获得免费抵押，请到资源管理中查看");
                        }else{
                            if(resp && resp.data){
                                EasyToast.show("抱歉，" + resp.data);
                            }else{
                                EasyToast.show("网络异常, 请稍后再试~");
                            }
                        }
                    }
                }) 
            }
          }
        });
    }catch (error) {
        EasyShowLD.dialogClose();
    }

  }

    chkAccount(obj) {
        var charmap = '.12345abcdefghijklmnopqrstuvwxyz';
        for(var i = 0 ; i < obj.length;i++){
            var tmp = obj.charAt(i);
            for(var j = 0;j < charmap.length; j++){
                if(tmp == charmap.charAt(j)){
                    break;
                }
            }
            if(j >= charmap.length){
                //非法字符
                obj = obj.replace(tmp, ""); 
                EasyToast.show('请输入正确的账号');
            }
        }
        return obj;
    }

    dismissKeyboardClick() {
        dismissKeyboard();
    }

   
  render() {
    return (<View style={[styles.container,{backgroundColor: UColor.secdColor}]}>
    <Header {...this.props} onPressLeft={true} title="EOS免费抵押" />
    <KeyboardAvoidingView behavior={Platform.OS == 'ios' ? "position" : null} style={styles.tab}>
    <ScrollView  keyboardShouldPersistTaps="always">
     <TouchableOpacity activeOpacity={1.0} onPress={this.dismissKeyboardClick.bind(this)}>
        <View style={styles.head}>
            <ImageBackground style={styles.bgout} source={UImage.freemortgage_bg} resizeMode="cover">
                <Text style={[styles.Explaintext,{color: UColor.arrow}]}>本功能由EosToken提供，用于免费帮助用户临时抵押资源,使其账户能正常使用。</Text>
                <Text style={[styles.Explaintextmiddle,{color: UColor.arrow}]}>温馨提示：成功申请免费抵押后，为了让账号持续正常使用，请尽快自行抵押。(官方将定期赎回抵押的资源)</Text>
                <Text style={[styles.Tipstext,{color: UColor.tintColor}]}>条件：计算资源{"<="}5ms或网络资源{"<="}10kb</Text>
                <Text style={[styles.Tipstext2,{ color: UColor.tintColor}]}>可获：计算资源2.5EOS、网络资源0.5EOS</Text>
            </ImageBackground>
        </View>
        <View style={styles.btnout}>
            <Text style={[styles.Applytext,{color: UColor.fontColor}]}>输入EOS账号</Text>
        </View>
        <View style={styles.header}>  
          <View style={[styles.inptout,{backgroundColor: UColor.mainColor}]} >
              <TextInput ref={(ref) => this._raccount = ref} value={this.state.labelname} returnKeyType="go"
                  selectionColor={UColor.tintColor} style={[styles.inpt,{color: UColor.arrow}]} placeholderTextColor={UColor.inputtip} maxLength={12} 
                  placeholder="输入账号名" underlineColorAndroid="transparent" keyboardType="default"
                  onChangeText={(labelname) => this.setState({ labelname: this.chkAccount(labelname)})}   
                  />  
              <TouchableOpacity onPress={this.Scan.bind(this,this.state.labelname)}>  
                  <Image source={UImage.account_scan} style={styles.headleftimg} />
              </TouchableOpacity>     
          </View>    
          <TouchableOpacity onPress={this.delegatebw.bind(this,this.state.labelname)} style={[styles.Applyout,{backgroundColor: UColor.tintColor}]}>  
              <Text style={[styles.canceltext,{color: UColor.btnColor}]}>提交申请</Text>
          </TouchableOpacity>   
      </View> 
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
    </View>
    );
  }
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: "column",
    },
    head: {
        flexDirection: "row",
        paddingVertical: ScreenUtil.autoheight(30),
        paddingHorizontal: ScreenUtil.autowidth(10)
    },
    bgout: {
        justifyContent: 'space-around',
        paddingTop: ScreenUtil.autowidth(70),
        paddingBottom: ScreenUtil.autowidth(20),
        paddingHorizontal: ScreenUtil.autowidth(20),
        width: ScreenWidth - ScreenUtil.autowidth(20),
        height: (ScreenWidth - ScreenUtil.autowidth(20))*0.8437,
    },
    Explaintext: {
        fontSize: ScreenUtil.setSpText(15),
        lineHeight: ScreenUtil.autowidth(25), 
    },
    Explaintextmiddle: {
        fontSize: ScreenUtil.setSpText(15),
        lineHeight: ScreenUtil.autowidth(25), 
    },
    Tipstext: {
        fontSize: ScreenUtil.setSpText(12),
    },
    Tipstext2: {
        fontSize: ScreenUtil.setSpText(12),
    },
    btnout: {
        flexDirection: "row",
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        height: ScreenUtil.autoheight(20),
        marginHorizontal: ScreenUtil.autowidth(20),
    },
    Applyout: {
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: ScreenUtil.autowidth(90),
        height: ScreenUtil.autoheight(35),
        marginHorizontal: ScreenUtil.autowidth(20),
    },
    Applytext: {
        fontSize: ScreenUtil.setSpText(15),
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: ScreenUtil.autoheight(7),
    },
      
    headleftimg: {
        width: ScreenUtil.autowidth(20),
        height: ScreenUtil.autowidth(20),
        marginHorizontal: ScreenUtil.autowidth(10),
    },
    inptout: {
        flex: 1,
        borderRadius: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'center',
        height: ScreenUtil.autoheight(35),
        marginLeft: ScreenUtil.autowidth(15),
        paddingLeft: ScreenUtil.autowidth(10),
    },
    inpt: {
        flex: 1,
        height: ScreenUtil.autoheight(40),
        fontSize: ScreenUtil.setSpText(15),
    },
    canceltext: {
        textAlign: 'center',
        fontSize: ScreenUtil.setSpText(15),
        paddingHorizontal:ScreenUtil.autowidth(8),
    },
    tab: {
        flex: 1,
    }
});
export default FreeMortgage;