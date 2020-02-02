import React from "react";
import { StyleSheet } from "react-native";
import {
  PanGestureHandler,
  State as GestureState,
  PanGestureHandlerEventExtra,
  GestureHandlerStateChangeNativeEvent
} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { springFill } from "./procs";
const {
  event,
  cond,
  Value,
  block,
  set,
  eq,
  not,
  or,
  abs,
  clockRunning,
  add,
  and,
  startClock,
  stopClock,
  greaterThan,
  greaterOrEq,
  lessThan,
  lessOrEq,
  call,
  Clock,
  onChange,
  multiply,
  divide
} = Animated;

const tempResolve = () => {};
const renderNull = () => null;

type VoidPromiseFn = () => Promise<void>;

type RenderUnderlay<T> = (params: {
  item: T;
  percentOpen: Animated.Node<number>;
  open: VoidPromiseFn;
  close: VoidPromiseFn;
}) => React.ReactNode;

type RenderOverlay<T> = (params: {
  item: T;
  openLeft: VoidPromiseFn;
  openRight: VoidPromiseFn;
  close: VoidPromiseFn;
}) => React.ReactNode;

type Props<T> = {
  item: T;
  children: React.ReactNode;
  renderOverlay?: RenderOverlay<T>;
  underlayWidthLeft: number;
  renderUnderlayLeft?: RenderUnderlay<T>;
  underlayWidthRight: number;
  renderUnderlayRight?: RenderUnderlay<T>;
  onChange: (params: { open: boolean | "left" | "right" }) => void;
  direction?: "left" | "right";
  overSwipe: number;
  animationConfig?: Partial<Animated.SpringConfig>;
  activationThreshold?: number;
  swipeEnabled?: boolean;
};

class SwipeableItem<T> extends React.PureComponent<Props<T>> {
  static defaultProps = {
    onChange: () => {},
    underlayWidthLeft: 0,
    underlayWidthRight: 0,
    overSwipe: 20,
    animationConfig: {},
    activationThreshold: 20,
    swipeEnabled: true
  };

  state = {
    open: null as "left" | "right" | null,
    swipeDirection: null as "left" | "right" | null
  };

  clock = new Clock();
  prevTranslate = new Value(0);
  gestureState = new Value(GestureState.UNDETERMINED);
  animState = {
    finished: new Value<number>(0),
    position: new Value<number>(0),
    velocity: new Value<number>(0),
    time: new Value<number>(0)
  };

  // Spring animation config
  // Determines how "springy" row is when it
  // snaps back into place after released
  animConfig: Animated.SpringConfig = {
    toValue: new Value<number>(0),
    damping: 20,
    mass: 0.2,
    stiffness: 100,
    overshootClamping: false,
    restSpeedThreshold: 0.5,
    restDisplacementThreshold: 0.5,
    ...this.props.animationConfig
  };

  panX = new Value(0);

  hasLeft = greaterThan(this.props.underlayWidthLeft, 0);
  hasRight = greaterThan(this.props.underlayWidthRight, 0);
  swipingLeft = lessThan(this.animState.position, 0);
  swipingRight = greaterThan(this.animState.position, 0);
  percentOpenLeft = cond(
    this.swipingLeft,
    divide(abs(this.animState.position), this.props.underlayWidthLeft)
  );
  percentOpenRight = cond(
    this.swipingRight,
    divide(abs(this.animState.position), this.props.underlayWidthRight)
  );
  isSwiping = or(this.swipingLeft, this.swipingRight);

  leftActive = or(
    this.swipingLeft,
    and(not(this.isSwiping), lessThan(this.panX, 0))
  );

  isActive = or(
    eq(this.gestureState, GestureState.ACTIVE),
    eq(this.gestureState, GestureState.BEGAN)
  );

  onSwipeLeftChange = ([isSwiping]: readonly number[]) => {
    if (isSwiping) this.setState({ swipeDirection: "left" });
  };
  onSwipeRightChange = ([isSwiping]: readonly number[]) => {
    if (isSwiping) this.setState({ swipeDirection: "right" });
  };
  onIsSwipingChange = ([isSwiping]: readonly number[]) => {
    if (!isSwiping) this.setState({ swipeDirection: null });
  };

  absPosition = abs(this.animState.position);

  exceedsThresholdLeft = greaterThan(
    this.absPosition,
    divide(this.props.underlayWidthLeft, 2)
  );
  exceedsThresholdRight = greaterThan(
    this.absPosition,
    divide(this.props.underlayWidthRight, 2)
  );
  exceedsThreshold = cond(
    this.swipingLeft,
    this.exceedsThresholdLeft,
    this.exceedsThresholdRight
  );

  underlayWidth = cond(
    this.leftActive,
    this.props.underlayWidthLeft,
    this.props.underlayWidthRight
  );

  underlayPosition = cond(
    this.leftActive,
    multiply(this.underlayWidth, -1),
    this.underlayWidth
  );

  openResolve: () => void = tempResolve;
  openLeftFlag = new Value<number>(0);
  openRightFlag = new Value<number>(0);
  open = (direction: "left" | "right") =>
    new Promise<void>(resolve => {
      // Make sure any previous promises are resolved before reassignment
      if (this.openResolve) this.openResolve();
      this.openResolve = resolve;
      if (direction === "left") this.openLeftFlag.setValue(1);
      else if (direction === "right") this.openRightFlag.setValue(1);
    });

  closeResolve: () => void = tempResolve;
  closeFlag = new Value<number>(0);
  close = () =>
    new Promise<void>(resolve => {
      // Make sure any previous promises are resolved before reassignment
      if (this.closeResolve) this.closeResolve();
      this.closeResolve = resolve;
      this.closeFlag.setValue(1);
    });

  onOpen = () => {
    if (this.openResolve) this.openResolve();
    this.props.onChange({ open: this.state.swipeDirection || false });
  };

  onClose = () => {
    if (this.closeResolve) this.closeResolve();
    this.setState({ swipeDirection: null });
    this.props.onChange({ open: false });
  };

  maxTranslate = cond(
    this.hasRight,
    add(this.props.underlayWidthRight, this.props.overSwipe),
    0
  );
  minTranslate = cond(
    this.hasLeft,
    multiply(-1, add(this.props.underlayWidthLeft, this.props.overSwipe)),
    0
  );

  onHandlerStateChange = event([
    {
      nativeEvent: ({ state }: GestureHandlerStateChangeNativeEvent) =>
        block([
          set(this.gestureState, state),
          cond(
            eq(this.gestureState, GestureState.BEGAN),
            set(this.prevTranslate, this.animState.position)
          )
        ])
    }
  ]);

  tempTranslate = new Value<number>(0);
  onPanEvent = event([
    {
      nativeEvent: ({ translationX }: PanGestureHandlerEventExtra) =>
        block([
          set(this.panX, translationX),
          set(this.tempTranslate, add(translationX, this.prevTranslate)),
          cond(
            and(
              eq(this.gestureState, GestureState.ACTIVE),
              lessOrEq(this.tempTranslate, this.maxTranslate),
              greaterOrEq(this.tempTranslate, this.minTranslate)
            ),
            set(this.animState.position, this.tempTranslate)
          )
        ])
    }
  ]);

  onAnimationEnd = ([position]: readonly number[]) => {
    if (position === 0) {
      this.setState({ open: null });
    } else {
      this.onOpen();
      this.setState({ open: position < 0 ? "left" : "right" });
    }
  };

  runCode = () =>
    block([
      cond(this.openLeftFlag, [
        set(
          this.animConfig.toValue as Animated.Value<number>,
          multiply(-1, this.props.underlayWidthLeft)
        ),
        startClock(this.clock),
        set(this.openLeftFlag, 0)
      ]),
      cond(this.openRightFlag, [
        set(
          this.animConfig.toValue as Animated.Value<number>,
          this.props.underlayWidthRight
        ),
        startClock(this.clock),
        set(this.openRightFlag, 0)
      ]),
      cond(this.closeFlag, [
        set(this.animConfig.toValue as Animated.Value<number>, 0),
        startClock(this.clock),
        set(this.closeFlag, 0)
      ]),
      onChange(
        this.swipingLeft,
        call([this.swipingLeft], this.onSwipeLeftChange)
      ),
      onChange(
        this.swipingRight,
        call([this.swipingRight], this.onSwipeRightChange)
      ),
      // Spring row back into place when user lifts their finger before reaching threshold
      onChange(this.isActive, [
        cond(and(not(this.isActive), not(clockRunning(this.clock))), [
          set(
            this.animConfig.toValue as Animated.Value<number>,
            cond(this.exceedsThreshold, this.underlayPosition, 0)
          ),
          startClock(this.clock)
        ])
      ]),
      onChange(this.isSwiping, call([this.isSwiping], this.onIsSwipingChange)),
      // If the clock is running, increment position in next tick by calling spring()
      cond(clockRunning(this.clock), [
        springFill(this.clock, this.animState, this.animConfig),
        // Stop and reset clock when spring is complete
        cond(this.animState.finished, [
          stopClock(this.clock),
          call([this.animState.position], this.onAnimationEnd),
          set(this.animState.finished, 0)
        ])
      ])
    ]);

  openLeft = () => this.open("left");
  openRight = () => this.open("right");

  render() {
    const {
      item,
      children,
      renderOverlay = renderNull,
      renderUnderlayLeft = renderNull,
      renderUnderlayRight = renderNull,
      underlayWidthLeft,
      underlayWidthRight,
      swipeEnabled,
      activationThreshold = 20
    } = this.props;
    const { swipeDirection, open } = this.state;
    const hasLeft = underlayWidthLeft > 0;
    const hasRight = underlayWidthRight > 0;
    const activeOffsetL =
      hasLeft || open === "right" ? -activationThreshold : -Number.MAX_VALUE;
    const activeOffsetR =
      hasRight || open === "left" ? activationThreshold : Number.MAX_VALUE;
    const activeOffsetX = [activeOffsetL, activeOffsetR];
    return (
      <>
        <Animated.View
          pointerEvents={swipeDirection === "left" ? "auto" : "none"}
          style={[styles.underlay, { opacity: this.leftActive }]}
        >
          {renderUnderlayLeft({
            item,
            percentOpen: this.percentOpenLeft,
            open: this.openLeft,
            close: this.close
          })}
        </Animated.View>
        <Animated.View
          pointerEvents={swipeDirection === "right" ? "auto" : "none"}
          style={[styles.underlay, { opacity: not(this.leftActive) }]}
        >
          {renderUnderlayRight({
            item,
            percentOpen: this.percentOpenRight,
            open: this.openRight,
            close: this.close
          })}
        </Animated.View>
        <PanGestureHandler
          enabled={swipeEnabled}
          activeOffsetX={activeOffsetX}
          onGestureEvent={this.onPanEvent}
          onHandlerStateChange={this.onHandlerStateChange}
        >
          <Animated.View
            style={{
              flex: 1,
              transform: [{ translateX: this.animState.position }]
            }}
          >
            <Animated.Code>{this.runCode}</Animated.Code>
            {children}
            {renderOverlay({
              item,
              openLeft: this.openLeft,
              openRight: this.openRight,
              close: this.close
            })}
          </Animated.View>
        </PanGestureHandler>
      </>
    );
  }
}

export default SwipeableItem;

const styles = StyleSheet.create({
  underlay: {
    ...StyleSheet.absoluteFillObject
  }
});