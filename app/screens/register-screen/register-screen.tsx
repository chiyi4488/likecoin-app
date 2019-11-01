import * as React from "react"
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputChangeEventData,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { NavigationScreenProps } from "react-navigation"
import { Icon } from "react-native-ui-kitten"
import { inject, observer } from "mobx-react"

import { UserStore } from "../../models/user-store"
import { UserLoginParams } from "../../services/api"

import { Button } from "../../components/button"
import { ButtonGroup } from "../../components/button-group"
import { Screen } from "../../components/screen"
import { Text } from "../../components/text"
import { sizes } from "../../components/text/text.sizes"

import { color, spacing } from "../../theme"

import CloseIcon from "../../assets/cross.svg"
import { translate } from "../../i18n"

export interface RegisterScreenParams {
  params: UserLoginParams,
}

export interface RegisterScreenProps extends NavigationScreenProps<RegisterScreenParams> {
  userStore: UserStore,
}

const LIKER_ID_REGEX = /[a-z0-9-_]{7,20}/

const ROOT: ViewStyle = {
  flex: 1,
  padding: spacing[4],
  paddingTop: spacing[0],
}
const TOP_BAR: ViewStyle = {
  alignItems: "flex-start",
}
const CONTENT_VIEW: ViewStyle = {
  flexGrow: 1,
  justifyContent: "center",
  alignItems: "center",
}
const BUTTON_GROUP: ViewStyle = {
  marginTop: spacing[4],
  paddingHorizontal: spacing[1],
  width: 256,
}
const RECEIVER_TEXT_INPUT = StyleSheet.create({
  ROOT: {
    flex: 1,
    minHeight: 16,
    margin: spacing[3],
  } as ViewStyle,
  TEXT: {
    color: color.palette.white,
    backgroundColor: color.transparent,
    fontSize: sizes.default,
    flex: 1,
  } as TextStyle,
})
const ERROR = StyleSheet.create({
  TEXT: {
    flexGrow: 1,
  } as TextStyle,
  VIEW: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    flexDirection: "row",
    width: BUTTON_GROUP.width,
  } as ViewStyle,
})
const BOTTOM_BAR: ViewStyle = {
  alignItems: "center",
}
const REGISTER: ViewStyle = {
  width: BUTTON_GROUP.width,
}

@inject("userStore")
@observer
export class RegisterScreen extends React.Component<RegisterScreenProps, {}> {
  state = {
    /**
     * The code of the error description which is looked up via i18n.
     */
    error: "",

    likerId: "",
  }

  /**
   * Validate the target input
   */
  _validate = (likerId: string) => {
    let error = ""
    this.setState({ error })

    // Check for Liker Id
    if (!LIKER_ID_REGEX.test(likerId)) {
      error = translate("error.LIKER_ID_FORMAT_INVALID")
    }

    if (error) {
      this.setState({ error })
      return false
    }

    return true
  }

  _onPressCloseButton = () => {
    this.props.navigation.goBack()
  }

  _onPressConfirmButton = async () => {
    // Trim before validation
    const likerId = this.state.likerId.trim()
    if (this._validate(likerId)) {
      const params = this.props.navigation.getParam("params")
      try {
        this.props.userStore.setIsSigningIn(true)
        await this.props.userStore.register({
          ...params,
          user: likerId,
        })
        this.props.navigation.navigate('LikerLandOAuth')
        this.props.userStore.fetchUserInfo()
      } catch (error) {
        this.setState({ error: error.message })
      } finally {
        this.props.userStore.setIsSigningIn(false)
      }
    }
  }

  _onLikerIdChange = (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
    console.tron.log(event.nativeEvent.text)
    this.setState({
      error: "",
      likerId: event.nativeEvent.text,
    })
  }

  render () {
    const { isSigningIn } = this.props.userStore
    const { likerId } = this.state
    return (
      <Screen
        preset="scroll"
        backgroundColor={color.palette.likeGreen}
        style={ROOT}
      >
        <View style={TOP_BAR}>
          <Button
            preset="icon"
            onPress={this._onPressCloseButton}
          >
            <CloseIcon
              width={24}
              height={24}
              fill={color.palette.white}
            />
          </Button>
        </View>
        <View style={CONTENT_VIEW}>
          <Text
            tx="registerScreen.likerIdLabel"
            align="center"
            color="likeCyan"
            weight="bold"
          />
          <ButtonGroup
            style={BUTTON_GROUP}
            prepend={
              <View
                key="receiverInput"
                style={RECEIVER_TEXT_INPUT.ROOT}
              >
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  selectionColor={color.palette.likeCyan}
                  style={RECEIVER_TEXT_INPUT.TEXT}
                  value={likerId}
                  onChange={this._onLikerIdChange}
                />
              </View>
            }
          />
          {this._renderError()}
        </View>
        <View style={BOTTOM_BAR}>
          <Button
            tx="common.confirm"
            isLoading={isSigningIn}
            style={REGISTER}
            onPress={this._onPressConfirmButton}
          />
        </View>
      </Screen>
    )
  }

  _renderError = () => {
    const { error } = this.state
    return (
      <View style={ERROR.VIEW}>
        <Text
          text={error}
          color="angry"
          isHidden={!error}
          prepend={
            <Icon
              name="alert-circle"
              fill={color.error}
              width={sizes.medium}
              height={sizes.medium}
            />
          }
          style={ERROR.TEXT}
        />
      </View>
    )
  }
}