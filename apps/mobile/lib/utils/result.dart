/// A sealed class representing either a successful result or a failure.
/// Used for propagating errors from services to the UI layer.
sealed class Result<T> {
  const Result();
  
  /// Factory constructor for creating a Success result
  factory Result.success(T data) = Success<T>;
  
  /// Factory constructor for creating a Failure result
  factory Result.failure(String message, [dynamic error]) = Failure<T>;
  
  /// Returns true if this is a Success result
  bool get isSuccess => this is Success<T>;
  
  /// Returns true if this is a Failure result
  bool get isFailure => this is Failure<T>;
  
  /// Returns the data if Success, throws StateError if Failure
  T get data {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    throw StateError('Cannot get data from Failure result: ${(this as Failure<T>).message}');
  }
  
  /// Returns the data if Success, or null if Failure
  T? get dataOrNull {
    if (this is Success<T>) {
      return (this as Success<T>).data;
    }
    return null;
  }
  
  /// Returns the error message if Failure, or null if Success
  /// Alias 'error' for backwards compatibility
  String? get errorMessage {
    if (this is Failure<T>) {
      return (this as Failure<T>).message;
    }
    return null;
  }
  
  /// Alias for errorMessage for backwards compatibility
  String? get error => errorMessage;
  
  /// Execute callback based on result type (pattern matching)
  R when<R>({
    required R Function(T data) success,
    required R Function(String error) failure,
  }) {
    if (this is Success<T>) {
      return success((this as Success<T>).data);
    }
    return failure((this as Failure<T>).message);
  }
  
  /// Map success value to a new type
  Result<R> map<R>(R Function(T data) mapper) {
    if (this is Success<T>) {
      return Result.success(mapper((this as Success<T>).data));
    }
    return Result.failure((this as Failure<T>).message);
  }
}

/// Represents a successful operation with data.
class Success<T> extends Result<T> {
  @override
  final T data;
  const Success(this.data);
}

/// Represents a failed operation with an error message.
class Failure<T> extends Result<T> {
  final String message;
  final dynamic _rawError;
  const Failure(this.message, [this._rawError]);
  
  /// Returns the raw error if available
  dynamic get rawError => _rawError;
}
