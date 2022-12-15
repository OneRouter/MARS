# MARS

## Multi-Axis Reanimated Swipeable

A swipeable component with underlay for React Native.

Fully native interactions powered by [Reanimated](https://github.com/software-mansion/react-native-reanimated) and [React Native Gesture Handler](https://github.com/software-mansion/react-native-gesture-handler)

Derived from [React Native Swipeable Item](https://github.com/computerjazz/react-native-swipeable-item)

Compatible with [React Native Draggable FlatList](https://github.com/computerjazz/react-native-draggable-flatlist)

![Swipeable Item demo](https://i.imgur.com/fFCnQ0n.gif)

## Install

1. Follow installation instructions for [reanimated](https://github.com/software-mansion/react-native-reanimated) and [react-native-gesture-handler](https://github.com/software-mansion/react-native-gesture-handler)
2. `npm install` or `yarn add` `@onerouter/mars`
3. `import Swipeable from '@onerouter/mars'`

### Props

_NOTE:_ Naming is hard. When you swipe _right_, you reveal the item on the _left_. With the vertical prop enabled, when you swipe _up_, you reveal the item on the _bottom_, and when you swipe _down_, you reveal the item on the _top_. So what do you name these things? I have decided to name everything according to swipe direction, but from a scroll position perspective (with "natural scrolling") - think of how you would swipe in a "viewpager"-style component. Therefore, a swipe _left_ (or _up_ if orientation is vertical) reveals the `renderUnderlayNext` component, _right_ (or _down_ if vertical) reveals the `renderUnderlayPrevious` component. Not perfect but it works.

_NOTE:_ _next_ and _previous_ are reversed (_next_ = _right_ and _previous_ = _left_) when horizontal (`vertical` prop not set to `true`) and in an RTL layout.

| Name                     | Type                                                                    | Description                                                                                                                                                              |
| :----------------------- | :---------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderUnderlayNext`     | `RenderUnderlay`                                                        | Component to be rendered underneath row on left/top swipe.                                                                                                               |
| `renderUnderlayPrevious` | `RenderUnderlay`                                                        | Component to be rendered underneath row on right/bottom swipe.                                                                                                           |
| `snapPointsNext`         | `number[]`                                                              | Pixel values left-(/top-)swipe snaps to (eg. `[100, 300]`)                                                                                                               |
| `snapPointsPrevious`     | `number[]`                                                              | Pixel values right-(/bottom-)swipe snaps to (eg. `[100, 300]`)                                                                                                           |
| `renderOverlay`          | `RenderOverlay`                                                         | Component to be rendered on above underlays. Use if you need access to programmatic open/close methods. May alternately pass children to Swipeable.                      |
| `onChange`               | `(params: { openDirection: OpenDirection, snapPoint: number }) => void` | Called when row is opened or closed.                                                                                                                                     |
| `swipeEnabled`           | `boolean`                                                               | Enable/disable swipe. Defaults to `true`.                                                                                                                                |
| `activationThreshold`    | `number`                                                                | Distance finger must travel before swipe engages. Defaults to 20.                                                                                                        |
| `swipeDamping`           | `number`                                                                | How much swipe velocity determines snap position. A smaller number means swipe velocity will have a larger effect and row will swipe open more easily. Defaults to `10`. |

### Hooks

| Name                 | Type                                                                                           | Description                                                                                                                                                                                                          |
| :------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSwipeableParams` | `() => OverlayParams<T> & { open: OpenPromiseFn, percentOpen: Animated.DerivedValue<number> }` | Utility hook that returns the same params as the render functions are called with. `open()` and `percentOpen` params reflect the context in which the hook is called (i.e. within an underlay or overlay component). |
|                      |

```tsx
function MyUnderlayComponent() {
  // Underlay components "know" which direction to open, so we don't need to call `openNext()` or `openPrevious()`, we can just call 'open()'
  // Underlay components also receive the `percentOpen` value of their own direction (`percentOpenNext` or `percentOpenPrevious`)
  const swipeableParams = useSwipeableParams();
  return <TouchableOpacity onPress={swipeableParams.open} />;
}

function MyOverlayComponent() {
  // Overlay components get the same params, but have defaults filled in for `open()` and `percentOpen` params.
  const swipeableParams = useSwipeableParams();
  return <TouchableOpacity onPress={swipeableParams.openNext} />;
}
```

### Instance Methods

| Name    | Type                                                                                                                   | Description                                                             |
| :------ | :--------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `open`  | `(OpenDirection.NEXT \| OpenDirection.PREVIOUS, snapIndex?: number, options?: { animated: boolean }) => Promise<void>` | Imperatively open left/top or right/bottom. Promise resolves once open. |
| `close` | `(options?: { animated?: boolean}) => Promise<void>`                                                                   | Close all. Promise resolves once closed.                                |

```tsx
// Imperative open example
const itemRef = useRef<SwipeableImperativeRef>(null)

...

<Swipeable ref={itemRef} />

...
itemRef.current?.open(OpenDirection.NEXT)
```

### Types

```ts
type OpenCloseOptions = { animated?: boolean };
export type OpenPromiseFn = (
  snapPoint?: number,
  options?: OpenCloseOptions
) => Promise<void>;
export type ClosePromiseFn = (options?: OpenCloseOptions) => Promise<void>;

export type UnderlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  percentOpen: Animated.DerivedValue<number>;
  isGestureActive: Animated.DerivedValue<boolean>;
  direction: OpenDirection;
};

export type OverlayParams<T> = {
  item: T;
  openNext: OpenPromiseFn;
  openPrevious: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirection;
  percentOpenNext: Animated.DerivedValue<number>;
  percentOpenPrevious: Animated.DerivedValue<number>;
};
```

### Notes

Gesture handlers can sometimes capture a gesture unintentionally. If you are using it with `react-native-draggable-flatlist` and the list is periodically not scrolling, try adding a small `activationDistance` (see the "Advanced" screen in the example snack).

### Example

[https://snack.expo.io/@computerjazz/swipeable-item](https://snack.expo.io/@computerjazz/swipeable-item)

```typescript
import React, { useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from "react-native";
import Swipeable, { useSwipeableParams } from "@onerouter/mars";

const NUM_ITEMS = 10;

function SimpleExample() {
  const renderItem: ListRenderItem<Item> = useCallback(({ item }) => {
    return (
      <Swipeable
        key={item.key}
        item={item}
        renderUnderlayNext={() => <UnderlayNext />}
        snapPointsNext={[150]}
      >
        <View
          style={[
            styles.row,
            { backgroundColor: item.backgroundColor, height: 100 },
          ]}
        >
          <Text style={styles.text}>{`${item.text}`}</Text>
        </View>
      </Swipeable>
    );
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        keyExtractor={(item) => item.key}
        data={initialData}
        renderItem={renderItem}
      />
    </View>
  );
}

export default SimpleExample;

const UnderlayNext = () => {
  const { close } = useSwipeableParams<Item>();
  return (
    <View style={[styles.row, styles.underlayNext]}>
      <TouchableOpacity onPress={() => close()}>
        <Text style={styles.text}>CLOSE</Text>
      </TouchableOpacity>
    </View>
  );
};

type Item = {
  key: string;
  text: string;
  backgroundColor: string;
};

function getColor(i: number) {
  const multiplier = 255 / (NUM_ITEMS - 1);
  const colorVal = i * multiplier;
  return `rgb(${colorVal}, ${Math.abs(128 - colorVal)}, ${255 - colorVal})`;
}

const initialData: Item[] = [...Array(NUM_ITEMS)].fill(0).map((d, index) => {
  const backgroundColor = getColor(index);
  return {
    text: `${index}`,
    key: `key-${backgroundColor}`,
    backgroundColor,
  };
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  text: {
    fontWeight: "bold",
    color: "white",
    fontSize: 32,
  },
  underlayNext: {
    flex: 1,
    backgroundColor: "tomato",
    justifyContent: "flex-end",
  },
});
```
