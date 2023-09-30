import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Text "mo:base/Text";

import Matchers "mo:matchers/Matchers";
import { assertThat } "mo:matchers/Matchers";
import Testable "mo:matchers/Testable";

import Test "../../../test";
import TestRunner "../../../test/test_runner";

import ModelManager "../../database/model_manager";
import Types "../../database/types";

module TestModelManager {
    module Movie = {
        public type UnsavedMovie = {
            var title : Text.Text;
            var year : Nat;
        };

        public type Movie = UnsavedMovie and {
            id : Nat;
        };

        public func toText(movie : ?Movie) : Text {
            switch (movie) {
                case (null) {
                    return "";
                };
                case (?movie) {
                    return movie.title # " (" # Nat.toText(movie.year) # ")";
                };
            };
        };

        public func equal(movieA : ?Movie, movieB : ?Movie) : Bool {
            switch (movieA, movieB) {
                case (null, null) {
                    return true;
                };
                case (null, _) {
                    return false;
                };
                case (_, null) {
                    return false;
                };
                case (?movieA, ?movieB) {
                    return movieA.id == movieB.id;
                };
            };
        };
    };

    type PrimaryKey = Nat;

    private func createModelManager<DataT, UnsavedDataT>({
        get_unique_pk : () -> PrimaryKey;
        prepare_obj_for_insert : (pk : PrimaryKey, data : UnsavedDataT) -> DataT;
        pk_getter : (Text, DataT) -> ?PrimaryKey;
        indexes : List.List<Types.IndexConfig<DataT, PrimaryKey>>;
    }) : ModelManager.ModelManager<PrimaryKey, DataT, UnsavedDataT> {
        return ModelManager.ModelManager<PrimaryKey, DataT, UnsavedDataT>({
            get_unique_pk = get_unique_pk;
            indexes = indexes;
            pk_attr_name = "id";
            pk_compare = Nat.compare;
            pk_getter = pk_getter;
            prepare_obj_for_insert = prepare_obj_for_insert;
            stable_data = #leaf;
        });
    };

    public func run(r : TestRunner.TestRunner, caller : Principal) : async () {
        var id_counter = 0;
        func createManager() : ModelManager.ModelManager<PrimaryKey, Movie.Movie, Movie.UnsavedMovie> {
            return createModelManager<Movie.Movie, Movie.UnsavedMovie>({
                get_unique_pk = func() {
                    id_counter := id_counter + 1;
                    return id_counter;
                };
                pk_getter = func(pk_attr_name, obj) {
                    return ?obj.id;
                };
                prepare_obj_for_insert = func(pk, unsaved) {
                    return {
                        id = pk;
                        var title = unsaved.title;
                        var year = unsaved.year;

                    };
                };
                indexes = List.fromArray([{
                    index_type = #unique;
                    field_name = "title";
                    value_type = #text;
                    add_value_to_index = func(attr_name : Text, obj : Movie.Movie, index : Types.Index<Text, Nat>) : () {
                        index.put(obj.title, obj.id);
                    };
                }]);
            });
        };

        await r.describe(
            "ModelManager.ModelManager",
            func() : async () {
                await r.describe(
                    "get",
                    func() : async () {
                        await r.it(
                            "should return a model",
                            func() : async Test.TestResult {
                                let manager = createManager();
                                let insert_result = manager.insert({
                                    var title = "The Matrix";
                                    var year = 1999;
                                });
                                let movie_pk = switch (insert_result) {
                                    case (#err(#keyAlreadyExists)) {
                                        return #err(#failedTest(?"Key already exists"));
                                    };
                                    case (#ok(pk, instance)) {
                                        pk;
                                    };
                                };

                                // assertions
                                let movie = manager.get(movie_pk);
                                let typed_movie = switch (movie) {
                                    case (null) {
                                        return #err(#failedTest(?"Movie not found"));
                                    };
                                    case (?movie) {
                                        movie;
                                    };
                                };

                                assertThat(typed_movie.title, Matchers.equals(Testable.text("The Matrix")));
                                assertThat(typed_movie.year, Matchers.equals(Testable.nat(1999)));

                                #ok;
                            },
                        );

                        await r.it(
                            "should return null if no instance is found",
                            func() : async Test.TestResult {
                                let manager = createManager();

                                // assertions
                                let movie = manager.get(1);
                                assertThat<Testable.TestableItem<?Movie.Movie>>(
                                    {
                                        display = Movie.toText;
                                        equals = Movie.equal;
                                        item = movie;
                                    },
                                    Matchers.isNull<Movie.Movie>(),
                                );

                                #ok;
                            },
                        );
                    },
                );

                await r.describe(
                    "indexFilter",
                    func() : async () {
                        await r.it(
                            "should return a query set of filtered model instances",
                            func() : async Test.TestResult {
                                let manager = createManager();
                                let insert_result = manager.insert({
                                    var title = "The Matrix";
                                    var year = 1999;
                                });
                                let movie_pk = switch (insert_result) {
                                    case (#err(#keyAlreadyExists)) {
                                        return #err(#failedTest(?"Received KeyAlreadyExists error"));
                                    };
                                    case (#ok(pk, instance)) {
                                        pk;
                                    };
                                };

                                // assertions
                                let movie = manager.indexFilter(
                                    "title",
                                    #text("The Matrix"),
                                ).first();

                                let typed_movie = switch (movie) {
                                    case (null) {
                                        return #err(#failedTest(?"Movie not found"));
                                    };
                                    case (?movie) {
                                        movie;
                                    };
                                };

                                assertThat(typed_movie.title, Matchers.equals(Testable.text("The Matrix")));
                                assertThat(typed_movie.year, Matchers.equals(Testable.nat(1999)));

                                #ok;
                            },
                        );
                    },
                );

                await r.describe(
                    "insert",
                    func() : async () {
                        await r.it(
                            "should insert a model instance",
                            func() : async Test.TestResult {
                                let manager = createManager();
                                let insert_result = manager.insert({
                                    var title = "The Matrix";
                                    var year = 1999;
                                });
                                let movie_pk = switch (insert_result) {
                                    case (#err(#keyAlreadyExists)) {
                                        return #err(#failedTest(?"Received KeyAlreadyExists error"));
                                    };
                                    case (#ok(pk, instance)) {
                                        pk;
                                    };
                                };
                                let movie = manager.get(movie_pk);
                                let typed_movie = switch (movie) {
                                    case (null) {
                                        return #err(#failedTest(?"Movie not found"));
                                    };
                                    case (?movie) {
                                        movie;
                                    };
                                };

                                assertThat(typed_movie.title, Matchers.equals(Testable.text("The Matrix")));
                                assertThat(typed_movie.year, Matchers.equals(Testable.nat(1999)));

                                #ok;
                            },
                        );
                    },
                );
                await r.describe(
                    "update",
                    func() : async () {
                        await r.it(
                            "should update the model instance",
                            func() : async Test.TestResult {
                                let manager = createManager();
                                let insert_result = manager.insert({
                                    var title = "The Matrix";
                                    var year = 1999;
                                });
                                var movie : Movie.Movie = switch (insert_result) {
                                    case (#err(#keyAlreadyExists)) {
                                        return #err(#failedTest(?"Received KeyAlreadyExists error"));
                                    };
                                    case (#ok(pk, instance)) {
                                        instance;
                                    };
                                };

                                movie.title := "The Matrix Reloaded";

                                let update_result = manager.update(movie);
                                let typed_movie = switch (update_result) {
                                    case (#err(#primaryKeyAttrNotFound)) {
                                        return #err(#failedTest(?"Received PrimaryKeyAttrNotFound error"));
                                    };
                                    case (#ok(pk, instance)) {
                                        instance;
                                    };
                                };

                                assertThat(typed_movie.title, Matchers.equals(Testable.text("The Matrix Reloaded")));
                                assertThat(typed_movie.year, Matchers.equals(Testable.nat(1999)));

                                #ok;
                            },
                        );
                    },
                );
                await r.describe(
                    "delete",
                    func() : async () {
                        await r.it(
                            "should delete the model instance",
                            func() : async Test.TestResult {
                                let manager = createManager();
                                let insert_result = manager.insert({
                                    var title = "The Matrix";
                                    var year = 1999;
                                });
                                let movie = switch (insert_result) {
                                    case (#err(#keyAlreadyExists)) {
                                        return #err(#failedTest(?"Received KeyAlreadyExists error"));
                                    };
                                    case (#ok(pk, instance)) {
                                        instance;
                                    };
                                };

                                // assertions
                                manager.delete(movie.id);

                                let movieAfterDelete = manager.get(movie.id);

                                assertThat<Testable.TestableItem<?Movie.Movie>>(
                                    {
                                        display = Movie.toText;
                                        equals = Movie.equal;
                                        item = movieAfterDelete;
                                    },
                                    Matchers.isNull<Movie.Movie>(),
                                );

                                #ok;
                            },
                        );
                    },
                );
            },
        );
    };
};
