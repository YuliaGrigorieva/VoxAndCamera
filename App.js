/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    StatusBar,
    View,
    TextInput,
    TouchableOpacity,
    Text,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import { Voximplant } from 'react-native-voximplant';

let USERNAME = "user@app.account.voximplant.com";
let PASSWORD = "password";

export default class App extends React.Component {
    constructor() {
        super();
        this.state = {
            type: 'front',
            number: null,
            showMakeCallView: true,
            localVideoStreamId: null,
            remoteVideoStreamId: null,
        };
        this.client = Voximplant.getInstance();
    }
    componentDidMount() {

    }

    async makeCall() {
        try {
            await this.client.disconnect();
            await this.client.connect();
            await this.client.login(USERNAME, PASSWORD);
            this.setState({showMakeCallView: false});
            this.call = await this.client.call(this.number, {video: {sendVideo: true, receiveVideo: true}});
            this.call.on(Voximplant.CallEvents.LocalVideoStreamAdded, (event) => {
                this.setState({localVideoStreamId: event.videoStream.id});
            });
            this.call.on(Voximplant.CallEvents.LocalVideoStreamRemoved, (event) => {
                this.setState({localVideoStreamId: null});
            });
            this.call.on(Voximplant.CallEvents.EndpointAdded, (event) => {
                this.endpoint = event.endpoint;
                this.endpoint.on(Voximplant.EndpointEvents.RemoteVideoStreamAdded, (endpointEvent) => {
                    this.setState({remoteVideoStreamId: endpointEvent.videoStream.id});
                });
                this.endpoint.on(Voximplant.EndpointEvents.RemoteVideoStreamRemoved, (endpointEvent) => {
                    this.setState({remoteVideoStreamId: null});
                });
            });
            this.call.on(Voximplant.CallEvents.Disconnected, (event) => {
                this.setState({showMakeCallView: true});
                this.call.off(Voximplant.CallEvents.EndpointAdded);
                this.call.off(Voximplant.CallEvents.LocalVideoStreamAdded);
                this.call.off(Voximplant.CallEvents.LocalVideoStreamRemoved);
                this.call.off(Voximplant.CallEvents.Disconnected);
            });
        } catch (e) {
            console.error(`Failure: ${e}`);
        }
    }

    endCall() {
        this.endpoint.off(Voximplant.EndpointEvents.RemoteVideoStreamAdded);
        this.endpoint.off(Voximplant.EndpointEvents.RemoteVideoStreamRemoved);
        this.endpoint = null;

        this.call.hangup();
    }

    render() {
        return (
            <SafeAreaView style={styles.safearea}>
              <StatusBar barStyle="light-content" backgroundColor="#392b5b" />
                {this.state.showMakeCallView ? (
                    <View style={styles.view}>
                        <RNCamera
                            ref={ref => {
                                this.camera = ref;
                            }}
                            style={styles.selfview}
                            type={this.state.type}
                            captureAudio={true}
                            androidCameraPermissionOptions={{
                                title: 'Permission to use camera',
                                message: 'We need your permission to use your camera',
                                buttonPositive: 'Ok',
                                buttonNegative: 'Cancel',
                            }}
                        />
                        <View style={styles.inputForm}>
                            <TextInput
                                underlineColorAndroid="transparent"
                                style={[styles.forminput, styles.margin]}
                                onChangeText={(text) => { this.number = text;}}
                                placeholder="Call to"
                                defaultValue={this.number}
                                autoCapitalize="none"
                                autoCorrect={false}
                                blurOnSubmit={true} />
                            <TouchableOpacity onPress={() => this.makeCall()} style={{ width: 220, alignSelf: 'center' }}>
                                <Text style={styles.button}>
                                    VIDEO CALL
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.view}>
                        <Voximplant.VideoView style={styles.remotevideo} videoStreamId={this.state.remoteVideoStreamId}
                                              scaleType={Voximplant.RenderScaleType.SCALE_FIT}/>
                        <Voximplant.VideoView style={styles.selfview} videoStreamId={this.state.localVideoStreamId}
                                              scaleType={Voximplant.RenderScaleType.SCALE_FIT} showOnTop={true}/>
                        <TouchableOpacity onPress={() => this.endCall()} style={{ width: 220, alignSelf: 'center' }}>
                            <Text style={styles.button}>
                                END CALL
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

            </SafeAreaView>
        );
  }
}

const styles = StyleSheet.create({
    safearea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    selfview: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 140,
        height: 200,
    },
    view: {
        flex: 1,
    },
    remotevideo: {
        flex: 1,
    },
    button: {
        color: '#662eff',
        fontSize: 16,
        alignSelf: 'center',
        paddingTop: 20,
        textAlign: 'center',
    },
    inputForm: {
        paddingHorizontal: 20,
        alignItems: 'stretch',
    },
    forminput: {
        padding: 5,
        marginBottom: 10,
        color: '#662eff',
        height: 40,
        borderColor: '#662eff',
        borderWidth: 1,
        borderRadius: 4,
    },
    margin: {
        margin: 10,
    },
});
