/// Generic Result type for operations that can succeed or fail
/// 
/// Industrial best practice for handling success/failure without exceptions.
library;

/// A sealed class representing either success or failure
sealed class Result<T> {
  const Result();
  
  /// Create a successful result with data
  factory Result.success(T data) = Success<T>;
  
  /// Create a failed result with an error message
  factory Result.failure(String error) = Failure<T>;
  
  /// Check if this is a success result
  bool get isSuccess => this is Success<T>;
  
  /// Check if this is a failure result
  bool get isFailure => this is Failure<T>;
  
  /// Get the data if success, throws if failure
  T get data {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    throw StateError('Cannot get data from Failure: ${(this as Failure<T>).error}');
  }
  
  /// Get the data if success, null otherwise
  T? get dataOrNull => switch (this) {
    Success(:final data) => data,
    Failure() => null,
  };
  
  /// Get the error if failure, null otherwise
  String? get error => switch (this) {
    Success() => null,
    Failure(:final error) => error,
  };
  
  /// Get the error if failure, null otherwise (alias for error)
  String? get errorOrNull => error;
  
  /// Map success value to a new type
  Result<R> map<R>(R Function(T data) mapper) => switch (this) {
    Success(:final data) => Result.success(mapper(data)),
    Failure(:final error) => Result.failure(error),
  };
  
  /// Execute callback based on result type
  R when<R>({
    required R Function(T data) success,
    required R Function(String error) failure,
  }) => switch (this) {
    Success(:final data) => success(data),
    Failure(:final error) => failure(error),
  };
}

/// Successful result containing data
final class Success<T> extends Result<T> {
  @override
  final T data;
  const Success(this.data);
  
  @override
  String toString() => 'Result.success($data)';
}

/// Failed result containing error message
final class Failure<T> extends Result<T> {
  @override
  final String error;
  const Failure(this.error);
  
  @override
  String toString() => 'Result.failure($error)';
}
