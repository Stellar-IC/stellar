import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Int64 "mo:base/Int64";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Iter "mo:base/Iter";
import Random "mo:base/Random";

module RandomNumberGenerator {
    public class RandomNumberGenerator() {
        var random = Random.Finite("Seed for RandomNumberGenerator");

        func byte() : Nat8 {
            let value = switch (random.byte()) {
                case (null) {
                    random := Random.Finite("Seed for RandomNumberGenerator");
                    switch (random.byte()) {
                        case (null) {
                            Debug.trap("RandomNumberGenerator: Random byte failed twice");
                        };
                        case (?value) { value };
                    };
                };
                case (?value) { value };
            };

            return value;
        };

        // TODO: There is a bug in this function. It should never return the max value.
        public func numberBetween(min : Nat, max : Nat) : Nat {
            let randomValue = byte();
            let range = Iter.range(min, max);
            let rangeSize = Iter.size(range);

            let maxRandomNumber = 255;

            // Scale index to be between 0 and the number of available node identifiers
            if (maxRandomNumber < rangeSize) {
                // scale up
                let scaleRatio = maxRandomNumber / rangeSize;
                let scaledRandomValue = Nat8.toNat(randomValue) / scaleRatio;

                return scaledRandomValue;
            };

            // scale down
            let scaleRatio : Float = Float.fromInt64(
                Int64.fromNat64(
                    Nat64.fromNat(
                        rangeSize
                    )
                )
            ) / Float.fromInt64(
                Int64.fromNat64(
                    Nat64.fromNat(
                        maxRandomNumber
                    )
                )
            );
            let scaledRandomValue = Float.fromInt64(
                Int64.fromNat64(
                    Nat64.fromNat(
                        Nat8.toNat(randomValue)
                    )
                )
            ) * scaleRatio;

            return Int.abs(
                Float.toInt(
                    Float.ceil(
                        scaledRandomValue
                    )
                )
            );
        };
    };
};
