import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, TextInput, Text, Platform } from 'react-native';

import { ImageAssets } from '~/assets';

type BaseTextInputProps = {
  label: string;
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

const BaseTextInput: React.FC<BaseTextInputProps> = ({
  label,
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
    <View className={` ${containerClassName} relative my-2 w-full`}>
      <View
        testID="input-container"
        className={`h-16 flex-row items-center justify-between rounded-xl border border-grey bg-white disabled:border-grey disabled:opacity-50 dark:border-inputDark dark:bg-inputDark ${
          isFocused && 'border-healthyGreen'
        } ${inputContainer} ${hasError && 'border-red'} `}>
        <TextInput
          testID={testId}
          keyboardType={type}
          value={value}
          onChangeText={onChangeText}
          className={`text-boldGreen h-full w-full px-4 text-[15px] font-[500] leading-[28px] text-inputText-light disabled:text-grey dark:text-inputText-dark  ${Platform.OS === 'android' ? 'mt-4' : 'mt-2'}`}
          maxLength={maxLength}
          editable={editable}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
          }}
          autoCapitalize={autoCapitalize}
          {...otherProps}
        />
        <Text
          className={`absolute left-4 transition-all duration-200 ${
            value || placeholder
              ? 'top-2 text-[13px] font-[500] text-[#768589]'
              : 'top-1/2 -translate-y-1/2 text-[15px] font-[500] text-greyText-dark dark:text-greyText-dark'
          } ${disabled ? ' text-grey' : ''}`}>
          {label}
        </Text>
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

export default BaseTextInput;
