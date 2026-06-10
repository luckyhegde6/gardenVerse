import "react-native";

declare module "react-native" {
  interface ViewProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface TextProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface ImagePropsBase {
    className?: string;
    cssInterop?: boolean;
  }
  interface TextInputProps {
    placeholderClassName?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface ScrollViewProps extends ViewProps {
    contentContainerClassName?: string;
    indicatorClassName?: string;
  }
  interface FlatListProps<_ItemT> {
    columnWrapperClassName?: string;
  }
  interface ImageBackgroundProps extends ImagePropsBase {
    imageClassName?: string;
  }
  interface SwitchProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface InputAccessoryViewProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface StatusBarProps {
    className?: string;
    cssInterop?: boolean;
  }
  interface KeyboardAvoidingViewProps extends ViewProps {
    contentContainerClassName?: string;
  }
  interface ModalBaseProps {
    presentationClassName?: string;
  }
}
