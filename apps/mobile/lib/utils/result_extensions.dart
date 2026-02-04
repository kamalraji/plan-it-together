import 'result.dart';

/// Extension methods for [Result] to simplify common operations.
extension ResultExtensions<T> on Result<T> {
  /// Returns the success data or a default value if this is a Failure.
  T getOrDefault(T defaultValue) => switch (this) {
    Success(data: final d) => d,
    Failure() => defaultValue,
  };

  /// Returns the success data or null if this is a Failure.
  T? getOrNull() => switch (this) {
    Success(data: final d) => d,
    Failure() => null,
  };

  /// Returns true if this is a Success.
  bool get isSuccess => this is Success<T>;

  /// Returns true if this is a Failure.
  bool get isFailure => this is Failure<T>;

  /// Returns the error message if this is a Failure, otherwise null.
  String? get errorMessage => switch (this) {
    Success() => null,
    Failure(message: final m) => m,
  };

  /// Returns the underlying error if this is a Failure, otherwise null.
  dynamic get errorObject => switch (this) {
    Success() => null,
    Failure(error: final e) => e,
  };

  /// Maps the success value to a new type.
  Result<R> map<R>(R Function(T data) transform) => switch (this) {
    Success(data: final d) => Success(transform(d)),
    Failure(message: final m, error: final e) => Failure(m, e),
  };

  /// Maps the success value to a new Result (flatMap/bind).
  Result<R> flatMap<R>(Result<R> Function(T data) transform) => switch (this) {
    Success(data: final d) => transform(d),
    Failure(message: final m, error: final e) => Failure(m, e),
  };

  /// Handles both success and failure cases with callbacks.
  void handle({
    required void Function(T data) onSuccess,
    required void Function(String message, dynamic error) onFailure,
  }) {
    switch (this) {
      case Success(data: final d):
        onSuccess(d);
      case Failure(message: final m, error: final e):
        onFailure(m, e);
    }
  }

  /// Handles both cases asynchronously.
  Future<void> handleAsync({
    required Future<void> Function(T data) onSuccess,
    required Future<void> Function(String message, dynamic error) onFailure,
  }) async {
    switch (this) {
      case Success(data: final d):
        await onSuccess(d);
      case Failure(message: final m, error: final e):
        await onFailure(m, e);
    }
  }

  /// Folds the result into a single value.
  R fold<R>({
    required R Function(T data) onSuccess,
    required R Function(String message, dynamic error) onFailure,
  }) => switch (this) {
    Success(data: final d) => onSuccess(d),
    Failure(message: final m, error: final e) => onFailure(m, e),
  };

  /// Recovers from a failure by providing a default success value.
  Result<T> recover(T Function(String message, dynamic error) recovery) => switch (this) {
    Success() => this,
    Failure(message: final m, error: final e) => Success(recovery(m, e)),
  };

  /// Recovers from a failure by providing an alternative Result.
  Result<T> recoverWith(Result<T> Function(String message, dynamic error) recovery) => switch (this) {
    Success() => this,
    Failure(message: final m, error: final e) => recovery(m, e),
  };
}

/// Extension for Result<List<T>> to handle empty lists.
extension ResultListExtensions<T> on Result<List<T>> {
  /// Returns true if this is a Success with a non-empty list.
  bool get hasData => switch (this) {
    Success(data: final d) => d.isNotEmpty,
    Failure() => false,
  };

  /// Returns the list length or 0 if Failure.
  int get length => switch (this) {
    Success(data: final d) => d.length,
    Failure() => 0,
  };
}

/// Helper to combine multiple Results into one.
class ResultCombiner {
  /// Combines two Results into a tuple Result.
  static Result<(T1, T2)> combine2<T1, T2>(
    Result<T1> r1,
    Result<T2> r2,
  ) {
    if (r1 is Failure<T1>) return Failure(r1.message, r1.error);
    if (r2 is Failure<T2>) return Failure(r2.message, r2.error);
    
    return Success(((r1 as Success<T1>).data, (r2 as Success<T2>).data));
  }

  /// Combines three Results into a tuple Result.
  static Result<(T1, T2, T3)> combine3<T1, T2, T3>(
    Result<T1> r1,
    Result<T2> r2,
    Result<T3> r3,
  ) {
    if (r1 is Failure<T1>) return Failure(r1.message, r1.error);
    if (r2 is Failure<T2>) return Failure(r2.message, r2.error);
    if (r3 is Failure<T3>) return Failure(r3.message, r3.error);
    
    return Success((
      (r1 as Success<T1>).data,
      (r2 as Success<T2>).data,
      (r3 as Success<T3>).data,
    ));
  }

  /// Combines a list of Results into a Result of list.
  static Result<List<T>> combineAll<T>(List<Result<T>> results) {
    final List<T> successData = [];
    
    for (final result in results) {
      switch (result) {
        case Success(data: final d):
          successData.add(d);
        case Failure(message: final m, error: final e):
          return Failure(m, e);
      }
    }
    
    return Success(successData);
  }
}
