# EventModule

**!!! Deprecated Information !!!**

See [Kafka](./kafka.md) for updated information about the event bus.

## This is how it was done before Kafka

The [`EventModule`](/src/core/eventbus/event.module.ts) can be used to listen to and publish events across the whole application. This can be used for decoupling logic.

The event system stores a `RXJS.Subject` for every event that is subscribed to.
Every event handler is registered as an observer of that subject and when publishing an Event it is pushed into the correct subject.

A specific order of the event-handlers is not guaranteed and should not be relied upon.

## Publishing events

All events need to extend the [`BaseEvent`](/src/shared/events/base-event.ts). We place all events in [`/src/shared/events`](/src/shared/events).

BaseEvent uses a marker property to ensure, that object literals can never be given to the event-system. This is important, because the event-system assumes that events are always specific class instances and it uses the constructor to differentiate events.

```ts
export class UserCreationEvent extends BaseEvent {
    public constructor(public readonly userId: string) {
        super();
    }
}
```

Events can be published using the [`EventService`](/src/core/eventbus/services/event.service.ts). Simply inject it in your classes and publish new events.

```ts
@Controller({ path: '/user' })
export class UserController {
    public constructor(private readonly eventService: EventService) {}

    @Post()
    public createUser(@Body() user): void {
        this.eventService.publish(new UserCreationEvent(user.id));
    }
}
```

Publishing an event can never fail. If one or more of the registered observers throw an error, the error will be logged.

## Listening to events

In order to listen to events, you need to register you handlers with the event service.

Handlers have to be of type `(ev: MyEvent) => void | Promise<void>`.
Errors that are thrown inside of handler methods will be logged but won't crash the application.

You can register your handlers using the following methods:

### Using @EventHandler()

The [`@EventHandler(...)`](/src/core/eventbus/decorators/event-handler.decorator.ts)-Decorator can be used to decorate methods of providers or controllers. Event-handlers will be automatically discovered and registered by the [`EventDiscoveryService`](src/core/eventbus/services/event-discovery.service.ts).

Make sure to add the class to your module definition so it gets registered by NestJS.

```ts
@Injectable()
export class ExampleProvider {
    @EventHandler(UserCreationEvent)
    public syncEventHandler(event: UserCreationEvent): void {
        // Will be called for every published UserCreationEvent
    }

    @EventHandler(UserCreationEvent)
    public async asyncEventHandler(event: UserCreationEvent): Promise<void> {
        // Will be called for every published UserCreationEvent
    }
}
```

### Using the `.register`-method directly

You can also register event-handlers by using the `EventService.subscribe`-method. This approach is not recommended but may be useful in some niche situations.

```ts
@Injectable()
export class ExampleProvider {
    public constructor(eventService: EventService) {
        const handler = (ev: UserCreationEvent) => {
            // [...]
        };

        eventService.subscribe(UserCreationEvent, handler);

        // You can unregister events using 'unsubscribe'
        eventService.unsubscribe(UserCreationEvent, handler);
    }
}
```

Using the subscribe-method directly will not bind the execution context (In contrast, events registered by the discovery service will be bound to the parent class). This is fine when using arrow-functions like in the example above, but when you want to use an unbounded function you will need to bind the context yourself using [`Function.prototype.bind()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind).

## Architectural considerations

In this section we have codified requirements around using the event system which go beyond simple technical operation.
An event system brings with it a mode of thinking about software which bears detailing.

### Event-Systems, use and limits thereof

Event-Systems, whether built on available buses or handcrafted, decouple system components.
It is neither useful, necessary nor desirable for components to know of each other when communicating through events.

Indeed, an event bus should be completely un-knowing of its users' specificities.
If it were cognisant of those this knowledge would introduce coupling. (If only semantically.)
Separate evolution would thus no longer be possible.
Would the bus know of **multiple** clients we'd introduce a dangerous dependency and the effort of using and maintaining
the event bus would be moot.

Hence, we must demand that the event bus would only ever send, route and receive events.
Changes in the application state itself can only happen if an event triggers them.
It is **strictly forbidden** for the event-bus to change application state.
As a corollary, it follows that the event bus cannot care about the number or lack thereof of registered clients.

### Semantics of events

An event on a bus is something that already happened.
Its name should thence be formulated as a participle (UserDeleted not DeleteUser or UserDeleting)

Events are **caused** not expected. So its name should be creator centric. No commands just facts.

Event should have a timestamp.
Also they can carry further payloads which should be small and be **simple**
* Not nested
* simple types (numbers, timestamps ids) only

### Summary

When planning to use events keep in mind the following:

1. You communicate through the bus not with it
   1. Only send and receive events
   2. The bus cannot call or even know of the components using it
2. Events are **things that happened**
   1. Neither are they things that will happen
   2. Nor things that should happen
   3. It's "UserDeleted" **not** "DeleteUser" or "UserDeleting"
3. Events are defined by the sender. If multiple things should happen in different components
   the same event must be processed by multiple receivers
4. Event-Payload should be as minimal as possible.
   Use IDs if you can.
5. Payloads should however contain a timestamp to facilitate tracing.

