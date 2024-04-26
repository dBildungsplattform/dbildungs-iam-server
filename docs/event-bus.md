# EventModule

The `EventModule` can be used to listen to and publish events across the whole application. This can be used for decoupling logic.

## Publishing events

All events need to extend the `BaseEvent`.

```ts
export class UserCreationEvent extends BaseEvent {
    public constructor(public readonly userId: string) {
        super(UserCreationEvent.name);
    }
}
```

Events can be published using the `EventService`. Simply inject it in your classes and publish new events.

```ts
@Controller({ path: "/user" })
export class UserController {
    public constructor(private readonly eventService: EventService) {}

    @Post()
    public createUser(@Body() user): void {
        this.eventService.publish(new UserCreationEvent(user.id));
    }
}
```

## Listening to events

### Using @EventHandler()

The `@EventHandler(...)`-Decorator can be used to decorate methods of providers or controllers. Event-handlers will be automatically discovered and registered by the event-service.

Make sure to add the class to your module definition so it gets registered by NestJS.

```ts
@Injectable()
export class ExampleProvider {
    @EventHandler(UserCreationEvent)
    public testEvent(event: UserCreationEvent): void {
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
        }

        eventService.subscribe(UserCreationEvent, handler);

        // You can unregister events using 'unsubscribe'
        eventService.unsubscribe(UserCreationEvent, handler);
    }
}
```

## Technical details

todo
