import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import {Button} from 'react-native-elements'
import Expo from 'expo'

export default class App extends React.Component {
  state = {
    duration: 1000 * 60 * 3,
    recording: false
  }

  constructor (props) {
    super(props)
    this._recordInstance = new Expo.Audio.Recording()
    this._recordInstance.setOnRecordingStatusUpdate(() => {
      this.onRecordingStatusUpdate()
    })
  }

  componentDidMount() {
    this.askForPermission()
  }

  onPress () {
    if (this.state.recording) {
      this.stop()
    } else {
      this.start()
    }
  }

  async askForPermission () {
    const permission = await Expo.Permissions.askAsync(Expo.Permissions.AUDIO_RECORDING)
    this.setState({hasPermission: permission.status === 'granted'})
  }

  timeRemaining () {
    let {endTime, lastTick} = this.state
    const minutesRemaining = Math.floor((endTime - lastTick) / 1000 / 60)
    const secondsRemaining = Math.round((endTime- lastTick)  / 1000 - minutesRemaining * 60)
    return {minutes: minutesRemaining, seconds: secondsRemaining}
  }

  recordingComplete () {
    console.log('recording complete')
  }

  stop () {
    this.setState({recording: false}, async () => {
      await this._recordInstance.stopAndUnloadAsync()
    })
  }

  async start () {
    clearInterval(this._timer)
    const currentTime = new Date().getTime()
    const endTime = currentTime + this.state.duration
    await Expo.Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
    })
    await this._recordInstance.prepareToRecordAsync(Expo.Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY)
    this.setState({
      recording: true,
      endTime,
      lastTick: currentTime
    }, async () => {
      this.setState({recording: true})
      try {
        await this._recordInstance.startAsync()
      } catch (error) {
        console.error(error)
      }

      this._timer = setInterval(
        () => {
          const lastTick = new Date().getTime()
          if (lastTick > endTime) {
            this.recordingComplete()
          } else {
            this.setState({lastTick})
          }
        },
        1000
      )
    })

  }

  onRecordingStatusUpdate (status) {
    console.log('recording status', status)
  }

  render() {
    return (
      <Image
        style={styles.container}
        source={require('./assets/priest.png')}
      >
      <Button
        onPress={() => this.onPress()}
        title={this.state.recording ? "STOP CONFESSING" : "CONFESS"}
        />
      </Image>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
