interface GenericEvent<T = EventTarget> extends Event {
  target: T;
}
