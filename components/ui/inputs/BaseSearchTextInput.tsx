import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, TextInput, Text } from 'react-native';

import { ImageAssets } from '~/assets';

type BaseSearchTextInputProps = {
  type?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  styleClass?: object;
  maxLength?: number;
  minLength?: number;
  value: string;
  disabled?: boolean;
  required?: boolean;
  onChangeText: (text: string) => void;
  hasError?: boolean | string | undefined;
  errorMsg?: string;
  containerClassName?: string;
  inputContainer?: string;
  min?: number | string;
  max?: number | string;
  editable?: boolean;
  testId?: string;
  disabledPrevDate?: boolean;
  placeholder?: string;
  placeholderTextColor?: string;
  name?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' | undefined;
  secureTextEntry?: boolean;
  textContentType:
    | 'none'
    | 'URL'
    | 'addressCity'
    | 'addressCityAndState'
    | 'addressState'
    | 'countryName'
    | 'creditCardNumber'
    | 'creditCardExpiration'
    | 'creditCardExpirationMonth'
    | 'creditCardExpirationYear'
    | 'creditCardSecurityCode'
    | 'creditCardType'
    | 'creditCardName'
    | 'creditCardGivenName'
    | 'creditCardMiddleName'
    | 'creditCardFamilyName'
    | 'emailAddress'
    | 'familyName'
    | 'fullStreetAddress'
    | 'givenName'
    | 'jobTitle'
    | 'location'
    | 'middleName'
    | 'name'
    | 'namePrefix'
    | 'nameSuffix'
    | 'nickname'
    | 'organizationName'
    | 'postalCode'
    | 'streetAddressLine1'
    | 'streetAddressLine2'
    | 'sublocality'
    | 'telephoneNumber'
    | 'username'
    | 'password'
    | 'newPassword'
    | 'oneTimeCode'
    | 'birthdate'
    | 'birthdateDay'
    | 'birthdateMonth'
    | 'birthdateYear'
    | undefined;
};

const BaseSearchTextInput: React.FC<BaseSearchTextInputProps> = ({
  type = 'default',
  styleClass = {},
  maxLength,
  minLength,
  value,
  disabled = false,
  required = false,
  onChangeText,
  hasError = false,
  errorMsg = '',
  containerClassName = '',
  inputContainer = '',
  editable = true,
  testId,
  placeholder,
  name,
  autoCapitalize = 'none',
  secureTextEntry = false,
  textContentType,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={` ${containerClassName} relative my-2 flex-1`}>
      <View
        testID="input-container"
        className={` flex-row items-center justify-between gap-2 rounded-lg bg-white px-2 disabled:opacity-50 dark:bg-inputDark ${
          isFocused && 'border-healthyGreen'
        } ${inputContainer} ${hasError && 'border-red'} `}>
        <Ionicons name="search-sharp" size={24} color="grey" />
        <TextInput
          testID={testId}
          keyboardType={type}
          value={value}
          onChangeText={onChangeText}
          className={`flex-1 text-[15px] font-[500] text-white placeholder:text-grey disabled:text-grey dark:text-inputText-dark  `}
          maxLength={maxLength}
          editable={editable}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          onBlur={() => {
            setIsFocused(false);
          }}
          autoCapitalize={autoCapitalize}
          {...otherProps}
        />
      </View>
      {hasError && (
        <View className=" mt-2 flex flex-row items-center gap-2 pl-2">
          <Image
            source={ImageAssets.error}
            style={{
              height: 13,
              width: 16,
            }}
          />
          <Text className=" text-sm leading-[13px] text-black">{errorMsg}</Text>
        </View>
      )}
    </View>
  );
};

export default BaseSearchTextInput;
