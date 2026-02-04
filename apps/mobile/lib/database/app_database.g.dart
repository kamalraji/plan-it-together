// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $CachedMessagesTable extends CachedMessages
    with TableInfo<$CachedMessagesTable, CachedMessageEntity> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedMessagesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _channelIdMeta =
      const VerificationMeta('channelId');
  @override
  late final GeneratedColumn<String> channelId = GeneratedColumn<String>(
      'channel_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _senderIdMeta =
      const VerificationMeta('senderId');
  @override
  late final GeneratedColumn<String> senderId = GeneratedColumn<String>(
      'sender_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _senderNameMeta =
      const VerificationMeta('senderName');
  @override
  late final GeneratedColumn<String> senderName = GeneratedColumn<String>(
      'sender_name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _senderAvatarMeta =
      const VerificationMeta('senderAvatar');
  @override
  late final GeneratedColumn<String> senderAvatar = GeneratedColumn<String>(
      'sender_avatar', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _contentMeta =
      const VerificationMeta('content');
  @override
  late final GeneratedColumn<String> content = GeneratedColumn<String>(
      'content', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _attachmentsJsonMeta =
      const VerificationMeta('attachmentsJson');
  @override
  late final GeneratedColumn<String> attachmentsJson = GeneratedColumn<String>(
      'attachments_json', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  static const VerificationMeta _sentAtMeta = const VerificationMeta('sentAt');
  @override
  late final GeneratedColumn<DateTime> sentAt = GeneratedColumn<DateTime>(
      'sent_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _editedAtMeta =
      const VerificationMeta('editedAt');
  @override
  late final GeneratedColumn<DateTime> editedAt = GeneratedColumn<DateTime>(
      'edited_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _deletedAtMeta =
      const VerificationMeta('deletedAt');
  @override
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
      'deleted_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _isDeletedMeta =
      const VerificationMeta('isDeleted');
  @override
  late final GeneratedColumn<bool> isDeleted = GeneratedColumn<bool>(
      'is_deleted', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("is_deleted" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _isEncryptedMeta =
      const VerificationMeta('isEncrypted');
  @override
  late final GeneratedColumn<bool> isEncrypted = GeneratedColumn<bool>(
      'is_encrypted', aliasedName, true,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints: GeneratedColumn.constraintIsAlways(
          'CHECK ("is_encrypted" IN (0, 1))'));
  static const VerificationMeta _encryptionVersionMeta =
      const VerificationMeta('encryptionVersion');
  @override
  late final GeneratedColumn<int> encryptionVersion = GeneratedColumn<int>(
      'encryption_version', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _senderPublicKeyMeta =
      const VerificationMeta('senderPublicKey');
  @override
  late final GeneratedColumn<String> senderPublicKey = GeneratedColumn<String>(
      'sender_public_key', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _nonceMeta = const VerificationMeta('nonce');
  @override
  late final GeneratedColumn<String> nonce = GeneratedColumn<String>(
      'nonce', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _cachedAtMeta =
      const VerificationMeta('cachedAt');
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
      'cached_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        channelId,
        senderId,
        senderName,
        senderAvatar,
        content,
        attachmentsJson,
        sentAt,
        editedAt,
        deletedAt,
        isDeleted,
        isEncrypted,
        encryptionVersion,
        senderPublicKey,
        nonce,
        cachedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_messages';
  @override
  VerificationContext validateIntegrity(
      Insertable<CachedMessageEntity> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('channel_id')) {
      context.handle(_channelIdMeta,
          channelId.isAcceptableOrUnknown(data['channel_id']!, _channelIdMeta));
    } else if (isInserting) {
      context.missing(_channelIdMeta);
    }
    if (data.containsKey('sender_id')) {
      context.handle(_senderIdMeta,
          senderId.isAcceptableOrUnknown(data['sender_id']!, _senderIdMeta));
    } else if (isInserting) {
      context.missing(_senderIdMeta);
    }
    if (data.containsKey('sender_name')) {
      context.handle(
          _senderNameMeta,
          senderName.isAcceptableOrUnknown(
              data['sender_name']!, _senderNameMeta));
    } else if (isInserting) {
      context.missing(_senderNameMeta);
    }
    if (data.containsKey('sender_avatar')) {
      context.handle(
          _senderAvatarMeta,
          senderAvatar.isAcceptableOrUnknown(
              data['sender_avatar']!, _senderAvatarMeta));
    }
    if (data.containsKey('content')) {
      context.handle(_contentMeta,
          content.isAcceptableOrUnknown(data['content']!, _contentMeta));
    } else if (isInserting) {
      context.missing(_contentMeta);
    }
    if (data.containsKey('attachments_json')) {
      context.handle(
          _attachmentsJsonMeta,
          attachmentsJson.isAcceptableOrUnknown(
              data['attachments_json']!, _attachmentsJsonMeta));
    }
    if (data.containsKey('sent_at')) {
      context.handle(_sentAtMeta,
          sentAt.isAcceptableOrUnknown(data['sent_at']!, _sentAtMeta));
    } else if (isInserting) {
      context.missing(_sentAtMeta);
    }
    if (data.containsKey('edited_at')) {
      context.handle(_editedAtMeta,
          editedAt.isAcceptableOrUnknown(data['edited_at']!, _editedAtMeta));
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    if (data.containsKey('is_deleted')) {
      context.handle(_isDeletedMeta,
          isDeleted.isAcceptableOrUnknown(data['is_deleted']!, _isDeletedMeta));
    }
    if (data.containsKey('is_encrypted')) {
      context.handle(
          _isEncryptedMeta,
          isEncrypted.isAcceptableOrUnknown(
              data['is_encrypted']!, _isEncryptedMeta));
    }
    if (data.containsKey('encryption_version')) {
      context.handle(
          _encryptionVersionMeta,
          encryptionVersion.isAcceptableOrUnknown(
              data['encryption_version']!, _encryptionVersionMeta));
    }
    if (data.containsKey('sender_public_key')) {
      context.handle(
          _senderPublicKeyMeta,
          senderPublicKey.isAcceptableOrUnknown(
              data['sender_public_key']!, _senderPublicKeyMeta));
    }
    if (data.containsKey('nonce')) {
      context.handle(
          _nonceMeta, nonce.isAcceptableOrUnknown(data['nonce']!, _nonceMeta));
    }
    if (data.containsKey('cached_at')) {
      context.handle(_cachedAtMeta,
          cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedMessageEntity map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedMessageEntity(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      channelId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_id'])!,
      senderId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sender_id'])!,
      senderName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sender_name'])!,
      senderAvatar: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}sender_avatar']),
      content: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}content'])!,
      attachmentsJson: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}attachments_json'])!,
      sentAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}sent_at'])!,
      editedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}edited_at']),
      deletedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
      isDeleted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_deleted'])!,
      isEncrypted: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}is_encrypted']),
      encryptionVersion: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}encryption_version']),
      senderPublicKey: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}sender_public_key']),
      nonce: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}nonce']),
      cachedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}cached_at'])!,
    );
  }

  @override
  $CachedMessagesTable createAlias(String alias) {
    return $CachedMessagesTable(attachedDatabase, alias);
  }
}

class CachedMessageEntity extends DataClass
    implements Insertable<CachedMessageEntity> {
  /// Message UUID (primary key from server)
  final String id;

  /// Channel this message belongs to
  final String channelId;

  /// Sender information
  final String senderId;
  final String senderName;
  final String? senderAvatar;

  /// Message content
  final String content;

  /// JSON-serialized attachments array
  final String attachmentsJson;

  /// Timestamps
  final DateTime sentAt;
  final DateTime? editedAt;
  final DateTime? deletedAt;
  final bool isDeleted;

  /// End-to-end encryption fields
  final bool? isEncrypted;
  final int? encryptionVersion;
  final String? senderPublicKey;
  final String? nonce;

  /// Cache metadata
  final DateTime cachedAt;
  const CachedMessageEntity(
      {required this.id,
      required this.channelId,
      required this.senderId,
      required this.senderName,
      this.senderAvatar,
      required this.content,
      required this.attachmentsJson,
      required this.sentAt,
      this.editedAt,
      this.deletedAt,
      required this.isDeleted,
      this.isEncrypted,
      this.encryptionVersion,
      this.senderPublicKey,
      this.nonce,
      required this.cachedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['channel_id'] = Variable<String>(channelId);
    map['sender_id'] = Variable<String>(senderId);
    map['sender_name'] = Variable<String>(senderName);
    if (!nullToAbsent || senderAvatar != null) {
      map['sender_avatar'] = Variable<String>(senderAvatar);
    }
    map['content'] = Variable<String>(content);
    map['attachments_json'] = Variable<String>(attachmentsJson);
    map['sent_at'] = Variable<DateTime>(sentAt);
    if (!nullToAbsent || editedAt != null) {
      map['edited_at'] = Variable<DateTime>(editedAt);
    }
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    map['is_deleted'] = Variable<bool>(isDeleted);
    if (!nullToAbsent || isEncrypted != null) {
      map['is_encrypted'] = Variable<bool>(isEncrypted);
    }
    if (!nullToAbsent || encryptionVersion != null) {
      map['encryption_version'] = Variable<int>(encryptionVersion);
    }
    if (!nullToAbsent || senderPublicKey != null) {
      map['sender_public_key'] = Variable<String>(senderPublicKey);
    }
    if (!nullToAbsent || nonce != null) {
      map['nonce'] = Variable<String>(nonce);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  CachedMessagesCompanion toCompanion(bool nullToAbsent) {
    return CachedMessagesCompanion(
      id: Value(id),
      channelId: Value(channelId),
      senderId: Value(senderId),
      senderName: Value(senderName),
      senderAvatar: senderAvatar == null && nullToAbsent
          ? const Value.absent()
          : Value(senderAvatar),
      content: Value(content),
      attachmentsJson: Value(attachmentsJson),
      sentAt: Value(sentAt),
      editedAt: editedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(editedAt),
      deletedAt: deletedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(deletedAt),
      isDeleted: Value(isDeleted),
      isEncrypted: isEncrypted == null && nullToAbsent
          ? const Value.absent()
          : Value(isEncrypted),
      encryptionVersion: encryptionVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(encryptionVersion),
      senderPublicKey: senderPublicKey == null && nullToAbsent
          ? const Value.absent()
          : Value(senderPublicKey),
      nonce:
          nonce == null && nullToAbsent ? const Value.absent() : Value(nonce),
      cachedAt: Value(cachedAt),
    );
  }

  factory CachedMessageEntity.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedMessageEntity(
      id: serializer.fromJson<String>(json['id']),
      channelId: serializer.fromJson<String>(json['channelId']),
      senderId: serializer.fromJson<String>(json['senderId']),
      senderName: serializer.fromJson<String>(json['senderName']),
      senderAvatar: serializer.fromJson<String?>(json['senderAvatar']),
      content: serializer.fromJson<String>(json['content']),
      attachmentsJson: serializer.fromJson<String>(json['attachmentsJson']),
      sentAt: serializer.fromJson<DateTime>(json['sentAt']),
      editedAt: serializer.fromJson<DateTime?>(json['editedAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
      isDeleted: serializer.fromJson<bool>(json['isDeleted']),
      isEncrypted: serializer.fromJson<bool?>(json['isEncrypted']),
      encryptionVersion: serializer.fromJson<int?>(json['encryptionVersion']),
      senderPublicKey: serializer.fromJson<String?>(json['senderPublicKey']),
      nonce: serializer.fromJson<String?>(json['nonce']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'channelId': serializer.toJson<String>(channelId),
      'senderId': serializer.toJson<String>(senderId),
      'senderName': serializer.toJson<String>(senderName),
      'senderAvatar': serializer.toJson<String?>(senderAvatar),
      'content': serializer.toJson<String>(content),
      'attachmentsJson': serializer.toJson<String>(attachmentsJson),
      'sentAt': serializer.toJson<DateTime>(sentAt),
      'editedAt': serializer.toJson<DateTime?>(editedAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
      'isDeleted': serializer.toJson<bool>(isDeleted),
      'isEncrypted': serializer.toJson<bool?>(isEncrypted),
      'encryptionVersion': serializer.toJson<int?>(encryptionVersion),
      'senderPublicKey': serializer.toJson<String?>(senderPublicKey),
      'nonce': serializer.toJson<String?>(nonce),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  CachedMessageEntity copyWith(
          {String? id,
          String? channelId,
          String? senderId,
          String? senderName,
          Value<String?> senderAvatar = const Value.absent(),
          String? content,
          String? attachmentsJson,
          DateTime? sentAt,
          Value<DateTime?> editedAt = const Value.absent(),
          Value<DateTime?> deletedAt = const Value.absent(),
          bool? isDeleted,
          Value<bool?> isEncrypted = const Value.absent(),
          Value<int?> encryptionVersion = const Value.absent(),
          Value<String?> senderPublicKey = const Value.absent(),
          Value<String?> nonce = const Value.absent(),
          DateTime? cachedAt}) =>
      CachedMessageEntity(
        id: id ?? this.id,
        channelId: channelId ?? this.channelId,
        senderId: senderId ?? this.senderId,
        senderName: senderName ?? this.senderName,
        senderAvatar:
            senderAvatar.present ? senderAvatar.value : this.senderAvatar,
        content: content ?? this.content,
        attachmentsJson: attachmentsJson ?? this.attachmentsJson,
        sentAt: sentAt ?? this.sentAt,
        editedAt: editedAt.present ? editedAt.value : this.editedAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
        isDeleted: isDeleted ?? this.isDeleted,
        isEncrypted: isEncrypted.present ? isEncrypted.value : this.isEncrypted,
        encryptionVersion: encryptionVersion.present
            ? encryptionVersion.value
            : this.encryptionVersion,
        senderPublicKey: senderPublicKey.present
            ? senderPublicKey.value
            : this.senderPublicKey,
        nonce: nonce.present ? nonce.value : this.nonce,
        cachedAt: cachedAt ?? this.cachedAt,
      );
  CachedMessageEntity copyWithCompanion(CachedMessagesCompanion data) {
    return CachedMessageEntity(
      id: data.id.present ? data.id.value : this.id,
      channelId: data.channelId.present ? data.channelId.value : this.channelId,
      senderId: data.senderId.present ? data.senderId.value : this.senderId,
      senderName:
          data.senderName.present ? data.senderName.value : this.senderName,
      senderAvatar: data.senderAvatar.present
          ? data.senderAvatar.value
          : this.senderAvatar,
      content: data.content.present ? data.content.value : this.content,
      attachmentsJson: data.attachmentsJson.present
          ? data.attachmentsJson.value
          : this.attachmentsJson,
      sentAt: data.sentAt.present ? data.sentAt.value : this.sentAt,
      editedAt: data.editedAt.present ? data.editedAt.value : this.editedAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
      isDeleted: data.isDeleted.present ? data.isDeleted.value : this.isDeleted,
      isEncrypted:
          data.isEncrypted.present ? data.isEncrypted.value : this.isEncrypted,
      encryptionVersion: data.encryptionVersion.present
          ? data.encryptionVersion.value
          : this.encryptionVersion,
      senderPublicKey: data.senderPublicKey.present
          ? data.senderPublicKey.value
          : this.senderPublicKey,
      nonce: data.nonce.present ? data.nonce.value : this.nonce,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedMessageEntity(')
          ..write('id: $id, ')
          ..write('channelId: $channelId, ')
          ..write('senderId: $senderId, ')
          ..write('senderName: $senderName, ')
          ..write('senderAvatar: $senderAvatar, ')
          ..write('content: $content, ')
          ..write('attachmentsJson: $attachmentsJson, ')
          ..write('sentAt: $sentAt, ')
          ..write('editedAt: $editedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('isDeleted: $isDeleted, ')
          ..write('isEncrypted: $isEncrypted, ')
          ..write('encryptionVersion: $encryptionVersion, ')
          ..write('senderPublicKey: $senderPublicKey, ')
          ..write('nonce: $nonce, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      channelId,
      senderId,
      senderName,
      senderAvatar,
      content,
      attachmentsJson,
      sentAt,
      editedAt,
      deletedAt,
      isDeleted,
      isEncrypted,
      encryptionVersion,
      senderPublicKey,
      nonce,
      cachedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedMessageEntity &&
          other.id == this.id &&
          other.channelId == this.channelId &&
          other.senderId == this.senderId &&
          other.senderName == this.senderName &&
          other.senderAvatar == this.senderAvatar &&
          other.content == this.content &&
          other.attachmentsJson == this.attachmentsJson &&
          other.sentAt == this.sentAt &&
          other.editedAt == this.editedAt &&
          other.deletedAt == this.deletedAt &&
          other.isDeleted == this.isDeleted &&
          other.isEncrypted == this.isEncrypted &&
          other.encryptionVersion == this.encryptionVersion &&
          other.senderPublicKey == this.senderPublicKey &&
          other.nonce == this.nonce &&
          other.cachedAt == this.cachedAt);
}

class CachedMessagesCompanion extends UpdateCompanion<CachedMessageEntity> {
  final Value<String> id;
  final Value<String> channelId;
  final Value<String> senderId;
  final Value<String> senderName;
  final Value<String?> senderAvatar;
  final Value<String> content;
  final Value<String> attachmentsJson;
  final Value<DateTime> sentAt;
  final Value<DateTime?> editedAt;
  final Value<DateTime?> deletedAt;
  final Value<bool> isDeleted;
  final Value<bool?> isEncrypted;
  final Value<int?> encryptionVersion;
  final Value<String?> senderPublicKey;
  final Value<String?> nonce;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const CachedMessagesCompanion({
    this.id = const Value.absent(),
    this.channelId = const Value.absent(),
    this.senderId = const Value.absent(),
    this.senderName = const Value.absent(),
    this.senderAvatar = const Value.absent(),
    this.content = const Value.absent(),
    this.attachmentsJson = const Value.absent(),
    this.sentAt = const Value.absent(),
    this.editedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.isDeleted = const Value.absent(),
    this.isEncrypted = const Value.absent(),
    this.encryptionVersion = const Value.absent(),
    this.senderPublicKey = const Value.absent(),
    this.nonce = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedMessagesCompanion.insert({
    required String id,
    required String channelId,
    required String senderId,
    required String senderName,
    this.senderAvatar = const Value.absent(),
    required String content,
    this.attachmentsJson = const Value.absent(),
    required DateTime sentAt,
    this.editedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.isDeleted = const Value.absent(),
    this.isEncrypted = const Value.absent(),
    this.encryptionVersion = const Value.absent(),
    this.senderPublicKey = const Value.absent(),
    this.nonce = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        channelId = Value(channelId),
        senderId = Value(senderId),
        senderName = Value(senderName),
        content = Value(content),
        sentAt = Value(sentAt);
  static Insertable<CachedMessageEntity> custom({
    Expression<String>? id,
    Expression<String>? channelId,
    Expression<String>? senderId,
    Expression<String>? senderName,
    Expression<String>? senderAvatar,
    Expression<String>? content,
    Expression<String>? attachmentsJson,
    Expression<DateTime>? sentAt,
    Expression<DateTime>? editedAt,
    Expression<DateTime>? deletedAt,
    Expression<bool>? isDeleted,
    Expression<bool>? isEncrypted,
    Expression<int>? encryptionVersion,
    Expression<String>? senderPublicKey,
    Expression<String>? nonce,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (channelId != null) 'channel_id': channelId,
      if (senderId != null) 'sender_id': senderId,
      if (senderName != null) 'sender_name': senderName,
      if (senderAvatar != null) 'sender_avatar': senderAvatar,
      if (content != null) 'content': content,
      if (attachmentsJson != null) 'attachments_json': attachmentsJson,
      if (sentAt != null) 'sent_at': sentAt,
      if (editedAt != null) 'edited_at': editedAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (isDeleted != null) 'is_deleted': isDeleted,
      if (isEncrypted != null) 'is_encrypted': isEncrypted,
      if (encryptionVersion != null) 'encryption_version': encryptionVersion,
      if (senderPublicKey != null) 'sender_public_key': senderPublicKey,
      if (nonce != null) 'nonce': nonce,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedMessagesCompanion copyWith(
      {Value<String>? id,
      Value<String>? channelId,
      Value<String>? senderId,
      Value<String>? senderName,
      Value<String?>? senderAvatar,
      Value<String>? content,
      Value<String>? attachmentsJson,
      Value<DateTime>? sentAt,
      Value<DateTime?>? editedAt,
      Value<DateTime?>? deletedAt,
      Value<bool>? isDeleted,
      Value<bool?>? isEncrypted,
      Value<int?>? encryptionVersion,
      Value<String?>? senderPublicKey,
      Value<String?>? nonce,
      Value<DateTime>? cachedAt,
      Value<int>? rowid}) {
    return CachedMessagesCompanion(
      id: id ?? this.id,
      channelId: channelId ?? this.channelId,
      senderId: senderId ?? this.senderId,
      senderName: senderName ?? this.senderName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
      content: content ?? this.content,
      attachmentsJson: attachmentsJson ?? this.attachmentsJson,
      sentAt: sentAt ?? this.sentAt,
      editedAt: editedAt ?? this.editedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      isDeleted: isDeleted ?? this.isDeleted,
      isEncrypted: isEncrypted ?? this.isEncrypted,
      encryptionVersion: encryptionVersion ?? this.encryptionVersion,
      senderPublicKey: senderPublicKey ?? this.senderPublicKey,
      nonce: nonce ?? this.nonce,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (channelId.present) {
      map['channel_id'] = Variable<String>(channelId.value);
    }
    if (senderId.present) {
      map['sender_id'] = Variable<String>(senderId.value);
    }
    if (senderName.present) {
      map['sender_name'] = Variable<String>(senderName.value);
    }
    if (senderAvatar.present) {
      map['sender_avatar'] = Variable<String>(senderAvatar.value);
    }
    if (content.present) {
      map['content'] = Variable<String>(content.value);
    }
    if (attachmentsJson.present) {
      map['attachments_json'] = Variable<String>(attachmentsJson.value);
    }
    if (sentAt.present) {
      map['sent_at'] = Variable<DateTime>(sentAt.value);
    }
    if (editedAt.present) {
      map['edited_at'] = Variable<DateTime>(editedAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (isDeleted.present) {
      map['is_deleted'] = Variable<bool>(isDeleted.value);
    }
    if (isEncrypted.present) {
      map['is_encrypted'] = Variable<bool>(isEncrypted.value);
    }
    if (encryptionVersion.present) {
      map['encryption_version'] = Variable<int>(encryptionVersion.value);
    }
    if (senderPublicKey.present) {
      map['sender_public_key'] = Variable<String>(senderPublicKey.value);
    }
    if (nonce.present) {
      map['nonce'] = Variable<String>(nonce.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedMessagesCompanion(')
          ..write('id: $id, ')
          ..write('channelId: $channelId, ')
          ..write('senderId: $senderId, ')
          ..write('senderName: $senderName, ')
          ..write('senderAvatar: $senderAvatar, ')
          ..write('content: $content, ')
          ..write('attachmentsJson: $attachmentsJson, ')
          ..write('sentAt: $sentAt, ')
          ..write('editedAt: $editedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('isDeleted: $isDeleted, ')
          ..write('isEncrypted: $isEncrypted, ')
          ..write('encryptionVersion: $encryptionVersion, ')
          ..write('senderPublicKey: $senderPublicKey, ')
          ..write('nonce: $nonce, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ChannelSyncMetaTable extends ChannelSyncMeta
    with TableInfo<$ChannelSyncMetaTable, ChannelSyncMetaEntity> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ChannelSyncMetaTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _channelIdMeta =
      const VerificationMeta('channelId');
  @override
  late final GeneratedColumn<String> channelId = GeneratedColumn<String>(
      'channel_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _lastSyncedAtMeta =
      const VerificationMeta('lastSyncedAt');
  @override
  late final GeneratedColumn<DateTime> lastSyncedAt = GeneratedColumn<DateTime>(
      'last_synced_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _hasMoreMeta =
      const VerificationMeta('hasMore');
  @override
  late final GeneratedColumn<bool> hasMore = GeneratedColumn<bool>(
      'has_more', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("has_more" IN (0, 1))'),
      defaultValue: const Constant(true));
  static const VerificationMeta _messageCountMeta =
      const VerificationMeta('messageCount');
  @override
  late final GeneratedColumn<int> messageCount = GeneratedColumn<int>(
      'message_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  @override
  List<GeneratedColumn> get $columns =>
      [channelId, lastSyncedAt, hasMore, messageCount];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'channel_sync_meta';
  @override
  VerificationContext validateIntegrity(
      Insertable<ChannelSyncMetaEntity> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('channel_id')) {
      context.handle(_channelIdMeta,
          channelId.isAcceptableOrUnknown(data['channel_id']!, _channelIdMeta));
    } else if (isInserting) {
      context.missing(_channelIdMeta);
    }
    if (data.containsKey('last_synced_at')) {
      context.handle(
          _lastSyncedAtMeta,
          lastSyncedAt.isAcceptableOrUnknown(
              data['last_synced_at']!, _lastSyncedAtMeta));
    } else if (isInserting) {
      context.missing(_lastSyncedAtMeta);
    }
    if (data.containsKey('has_more')) {
      context.handle(_hasMoreMeta,
          hasMore.isAcceptableOrUnknown(data['has_more']!, _hasMoreMeta));
    }
    if (data.containsKey('message_count')) {
      context.handle(
          _messageCountMeta,
          messageCount.isAcceptableOrUnknown(
              data['message_count']!, _messageCountMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {channelId};
  @override
  ChannelSyncMetaEntity map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ChannelSyncMetaEntity(
      channelId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}channel_id'])!,
      lastSyncedAt: attachedDatabase.typeMapping.read(
          DriftSqlType.dateTime, data['${effectivePrefix}last_synced_at'])!,
      hasMore: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}has_more'])!,
      messageCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}message_count'])!,
    );
  }

  @override
  $ChannelSyncMetaTable createAlias(String alias) {
    return $ChannelSyncMetaTable(attachedDatabase, alias);
  }
}

class ChannelSyncMetaEntity extends DataClass
    implements Insertable<ChannelSyncMetaEntity> {
  /// Channel UUID (primary key)
  final String channelId;

  /// Last successful sync timestamp
  final DateTime lastSyncedAt;

  /// Whether there are more messages to fetch (pagination)
  final bool hasMore;

  /// Total message count in cache for this channel
  final int messageCount;
  const ChannelSyncMetaEntity(
      {required this.channelId,
      required this.lastSyncedAt,
      required this.hasMore,
      required this.messageCount});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['channel_id'] = Variable<String>(channelId);
    map['last_synced_at'] = Variable<DateTime>(lastSyncedAt);
    map['has_more'] = Variable<bool>(hasMore);
    map['message_count'] = Variable<int>(messageCount);
    return map;
  }

  ChannelSyncMetaCompanion toCompanion(bool nullToAbsent) {
    return ChannelSyncMetaCompanion(
      channelId: Value(channelId),
      lastSyncedAt: Value(lastSyncedAt),
      hasMore: Value(hasMore),
      messageCount: Value(messageCount),
    );
  }

  factory ChannelSyncMetaEntity.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ChannelSyncMetaEntity(
      channelId: serializer.fromJson<String>(json['channelId']),
      lastSyncedAt: serializer.fromJson<DateTime>(json['lastSyncedAt']),
      hasMore: serializer.fromJson<bool>(json['hasMore']),
      messageCount: serializer.fromJson<int>(json['messageCount']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'channelId': serializer.toJson<String>(channelId),
      'lastSyncedAt': serializer.toJson<DateTime>(lastSyncedAt),
      'hasMore': serializer.toJson<bool>(hasMore),
      'messageCount': serializer.toJson<int>(messageCount),
    };
  }

  ChannelSyncMetaEntity copyWith(
          {String? channelId,
          DateTime? lastSyncedAt,
          bool? hasMore,
          int? messageCount}) =>
      ChannelSyncMetaEntity(
        channelId: channelId ?? this.channelId,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
        hasMore: hasMore ?? this.hasMore,
        messageCount: messageCount ?? this.messageCount,
      );
  ChannelSyncMetaEntity copyWithCompanion(ChannelSyncMetaCompanion data) {
    return ChannelSyncMetaEntity(
      channelId: data.channelId.present ? data.channelId.value : this.channelId,
      lastSyncedAt: data.lastSyncedAt.present
          ? data.lastSyncedAt.value
          : this.lastSyncedAt,
      hasMore: data.hasMore.present ? data.hasMore.value : this.hasMore,
      messageCount: data.messageCount.present
          ? data.messageCount.value
          : this.messageCount,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ChannelSyncMetaEntity(')
          ..write('channelId: $channelId, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('hasMore: $hasMore, ')
          ..write('messageCount: $messageCount')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(channelId, lastSyncedAt, hasMore, messageCount);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ChannelSyncMetaEntity &&
          other.channelId == this.channelId &&
          other.lastSyncedAt == this.lastSyncedAt &&
          other.hasMore == this.hasMore &&
          other.messageCount == this.messageCount);
}

class ChannelSyncMetaCompanion extends UpdateCompanion<ChannelSyncMetaEntity> {
  final Value<String> channelId;
  final Value<DateTime> lastSyncedAt;
  final Value<bool> hasMore;
  final Value<int> messageCount;
  final Value<int> rowid;
  const ChannelSyncMetaCompanion({
    this.channelId = const Value.absent(),
    this.lastSyncedAt = const Value.absent(),
    this.hasMore = const Value.absent(),
    this.messageCount = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ChannelSyncMetaCompanion.insert({
    required String channelId,
    required DateTime lastSyncedAt,
    this.hasMore = const Value.absent(),
    this.messageCount = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : channelId = Value(channelId),
        lastSyncedAt = Value(lastSyncedAt);
  static Insertable<ChannelSyncMetaEntity> custom({
    Expression<String>? channelId,
    Expression<DateTime>? lastSyncedAt,
    Expression<bool>? hasMore,
    Expression<int>? messageCount,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (channelId != null) 'channel_id': channelId,
      if (lastSyncedAt != null) 'last_synced_at': lastSyncedAt,
      if (hasMore != null) 'has_more': hasMore,
      if (messageCount != null) 'message_count': messageCount,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ChannelSyncMetaCompanion copyWith(
      {Value<String>? channelId,
      Value<DateTime>? lastSyncedAt,
      Value<bool>? hasMore,
      Value<int>? messageCount,
      Value<int>? rowid}) {
    return ChannelSyncMetaCompanion(
      channelId: channelId ?? this.channelId,
      lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      hasMore: hasMore ?? this.hasMore,
      messageCount: messageCount ?? this.messageCount,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (channelId.present) {
      map['channel_id'] = Variable<String>(channelId.value);
    }
    if (lastSyncedAt.present) {
      map['last_synced_at'] = Variable<DateTime>(lastSyncedAt.value);
    }
    if (hasMore.present) {
      map['has_more'] = Variable<bool>(hasMore.value);
    }
    if (messageCount.present) {
      map['message_count'] = Variable<int>(messageCount.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ChannelSyncMetaCompanion(')
          ..write('channelId: $channelId, ')
          ..write('lastSyncedAt: $lastSyncedAt, ')
          ..write('hasMore: $hasMore, ')
          ..write('messageCount: $messageCount, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedMessagesTable cachedMessages = $CachedMessagesTable(this);
  late final $ChannelSyncMetaTable channelSyncMeta =
      $ChannelSyncMetaTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [cachedMessages, channelSyncMeta];
}

typedef $$CachedMessagesTableCreateCompanionBuilder = CachedMessagesCompanion
    Function({
  required String id,
  required String channelId,
  required String senderId,
  required String senderName,
  Value<String?> senderAvatar,
  required String content,
  Value<String> attachmentsJson,
  required DateTime sentAt,
  Value<DateTime?> editedAt,
  Value<DateTime?> deletedAt,
  Value<bool> isDeleted,
  Value<bool?> isEncrypted,
  Value<int?> encryptionVersion,
  Value<String?> senderPublicKey,
  Value<String?> nonce,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});
typedef $$CachedMessagesTableUpdateCompanionBuilder = CachedMessagesCompanion
    Function({
  Value<String> id,
  Value<String> channelId,
  Value<String> senderId,
  Value<String> senderName,
  Value<String?> senderAvatar,
  Value<String> content,
  Value<String> attachmentsJson,
  Value<DateTime> sentAt,
  Value<DateTime?> editedAt,
  Value<DateTime?> deletedAt,
  Value<bool> isDeleted,
  Value<bool?> isEncrypted,
  Value<int?> encryptionVersion,
  Value<String?> senderPublicKey,
  Value<String?> nonce,
  Value<DateTime> cachedAt,
  Value<int> rowid,
});

class $$CachedMessagesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedMessagesTable> {
  $$CachedMessagesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get senderId => $composableBuilder(
      column: $table.senderId, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get senderName => $composableBuilder(
      column: $table.senderName, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get senderAvatar => $composableBuilder(
      column: $table.senderAvatar, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get content => $composableBuilder(
      column: $table.content, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get attachmentsJson => $composableBuilder(
      column: $table.attachmentsJson,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get sentAt => $composableBuilder(
      column: $table.sentAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get editedAt => $composableBuilder(
      column: $table.editedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isDeleted => $composableBuilder(
      column: $table.isDeleted, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get isEncrypted => $composableBuilder(
      column: $table.isEncrypted, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get encryptionVersion => $composableBuilder(
      column: $table.encryptionVersion,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get senderPublicKey => $composableBuilder(
      column: $table.senderPublicKey,
      builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get nonce => $composableBuilder(
      column: $table.nonce, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnFilters(column));
}

class $$CachedMessagesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedMessagesTable> {
  $$CachedMessagesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get senderId => $composableBuilder(
      column: $table.senderId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get senderName => $composableBuilder(
      column: $table.senderName, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get senderAvatar => $composableBuilder(
      column: $table.senderAvatar,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get content => $composableBuilder(
      column: $table.content, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get attachmentsJson => $composableBuilder(
      column: $table.attachmentsJson,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get sentAt => $composableBuilder(
      column: $table.sentAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get editedAt => $composableBuilder(
      column: $table.editedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get deletedAt => $composableBuilder(
      column: $table.deletedAt, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isDeleted => $composableBuilder(
      column: $table.isDeleted, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get isEncrypted => $composableBuilder(
      column: $table.isEncrypted, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get encryptionVersion => $composableBuilder(
      column: $table.encryptionVersion,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get senderPublicKey => $composableBuilder(
      column: $table.senderPublicKey,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get nonce => $composableBuilder(
      column: $table.nonce, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
      column: $table.cachedAt, builder: (column) => ColumnOrderings(column));
}

class $$CachedMessagesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedMessagesTable> {
  $$CachedMessagesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get channelId =>
      $composableBuilder(column: $table.channelId, builder: (column) => column);

  GeneratedColumn<String> get senderId =>
      $composableBuilder(column: $table.senderId, builder: (column) => column);

  GeneratedColumn<String> get senderName => $composableBuilder(
      column: $table.senderName, builder: (column) => column);

  GeneratedColumn<String> get senderAvatar => $composableBuilder(
      column: $table.senderAvatar, builder: (column) => column);

  GeneratedColumn<String> get content =>
      $composableBuilder(column: $table.content, builder: (column) => column);

  GeneratedColumn<String> get attachmentsJson => $composableBuilder(
      column: $table.attachmentsJson, builder: (column) => column);

  GeneratedColumn<DateTime> get sentAt =>
      $composableBuilder(column: $table.sentAt, builder: (column) => column);

  GeneratedColumn<DateTime> get editedAt =>
      $composableBuilder(column: $table.editedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get deletedAt =>
      $composableBuilder(column: $table.deletedAt, builder: (column) => column);

  GeneratedColumn<bool> get isDeleted =>
      $composableBuilder(column: $table.isDeleted, builder: (column) => column);

  GeneratedColumn<bool> get isEncrypted => $composableBuilder(
      column: $table.isEncrypted, builder: (column) => column);

  GeneratedColumn<int> get encryptionVersion => $composableBuilder(
      column: $table.encryptionVersion, builder: (column) => column);

  GeneratedColumn<String> get senderPublicKey => $composableBuilder(
      column: $table.senderPublicKey, builder: (column) => column);

  GeneratedColumn<String> get nonce =>
      $composableBuilder(column: $table.nonce, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$CachedMessagesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CachedMessagesTable,
    CachedMessageEntity,
    $$CachedMessagesTableFilterComposer,
    $$CachedMessagesTableOrderingComposer,
    $$CachedMessagesTableAnnotationComposer,
    $$CachedMessagesTableCreateCompanionBuilder,
    $$CachedMessagesTableUpdateCompanionBuilder,
    (
      CachedMessageEntity,
      BaseReferences<_$AppDatabase, $CachedMessagesTable, CachedMessageEntity>
    ),
    CachedMessageEntity,
    PrefetchHooks Function()> {
  $$CachedMessagesTableTableManager(
      _$AppDatabase db, $CachedMessagesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedMessagesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedMessagesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedMessagesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> channelId = const Value.absent(),
            Value<String> senderId = const Value.absent(),
            Value<String> senderName = const Value.absent(),
            Value<String?> senderAvatar = const Value.absent(),
            Value<String> content = const Value.absent(),
            Value<String> attachmentsJson = const Value.absent(),
            Value<DateTime> sentAt = const Value.absent(),
            Value<DateTime?> editedAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<bool> isDeleted = const Value.absent(),
            Value<bool?> isEncrypted = const Value.absent(),
            Value<int?> encryptionVersion = const Value.absent(),
            Value<String?> senderPublicKey = const Value.absent(),
            Value<String?> nonce = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedMessagesCompanion(
            id: id,
            channelId: channelId,
            senderId: senderId,
            senderName: senderName,
            senderAvatar: senderAvatar,
            content: content,
            attachmentsJson: attachmentsJson,
            sentAt: sentAt,
            editedAt: editedAt,
            deletedAt: deletedAt,
            isDeleted: isDeleted,
            isEncrypted: isEncrypted,
            encryptionVersion: encryptionVersion,
            senderPublicKey: senderPublicKey,
            nonce: nonce,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String channelId,
            required String senderId,
            required String senderName,
            Value<String?> senderAvatar = const Value.absent(),
            required String content,
            Value<String> attachmentsJson = const Value.absent(),
            required DateTime sentAt,
            Value<DateTime?> editedAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<bool> isDeleted = const Value.absent(),
            Value<bool?> isEncrypted = const Value.absent(),
            Value<int?> encryptionVersion = const Value.absent(),
            Value<String?> senderPublicKey = const Value.absent(),
            Value<String?> nonce = const Value.absent(),
            Value<DateTime> cachedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CachedMessagesCompanion.insert(
            id: id,
            channelId: channelId,
            senderId: senderId,
            senderName: senderName,
            senderAvatar: senderAvatar,
            content: content,
            attachmentsJson: attachmentsJson,
            sentAt: sentAt,
            editedAt: editedAt,
            deletedAt: deletedAt,
            isDeleted: isDeleted,
            isEncrypted: isEncrypted,
            encryptionVersion: encryptionVersion,
            senderPublicKey: senderPublicKey,
            nonce: nonce,
            cachedAt: cachedAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$CachedMessagesTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $CachedMessagesTable,
    CachedMessageEntity,
    $$CachedMessagesTableFilterComposer,
    $$CachedMessagesTableOrderingComposer,
    $$CachedMessagesTableAnnotationComposer,
    $$CachedMessagesTableCreateCompanionBuilder,
    $$CachedMessagesTableUpdateCompanionBuilder,
    (
      CachedMessageEntity,
      BaseReferences<_$AppDatabase, $CachedMessagesTable, CachedMessageEntity>
    ),
    CachedMessageEntity,
    PrefetchHooks Function()>;
typedef $$ChannelSyncMetaTableCreateCompanionBuilder = ChannelSyncMetaCompanion
    Function({
  required String channelId,
  required DateTime lastSyncedAt,
  Value<bool> hasMore,
  Value<int> messageCount,
  Value<int> rowid,
});
typedef $$ChannelSyncMetaTableUpdateCompanionBuilder = ChannelSyncMetaCompanion
    Function({
  Value<String> channelId,
  Value<DateTime> lastSyncedAt,
  Value<bool> hasMore,
  Value<int> messageCount,
  Value<int> rowid,
});

class $$ChannelSyncMetaTableFilterComposer
    extends Composer<_$AppDatabase, $ChannelSyncMetaTable> {
  $$ChannelSyncMetaTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt, builder: (column) => ColumnFilters(column));

  ColumnFilters<bool> get hasMore => $composableBuilder(
      column: $table.hasMore, builder: (column) => ColumnFilters(column));

  ColumnFilters<int> get messageCount => $composableBuilder(
      column: $table.messageCount, builder: (column) => ColumnFilters(column));
}

class $$ChannelSyncMetaTableOrderingComposer
    extends Composer<_$AppDatabase, $ChannelSyncMetaTable> {
  $$ChannelSyncMetaTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get channelId => $composableBuilder(
      column: $table.channelId, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt,
      builder: (column) => ColumnOrderings(column));

  ColumnOrderings<bool> get hasMore => $composableBuilder(
      column: $table.hasMore, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get messageCount => $composableBuilder(
      column: $table.messageCount,
      builder: (column) => ColumnOrderings(column));
}

class $$ChannelSyncMetaTableAnnotationComposer
    extends Composer<_$AppDatabase, $ChannelSyncMetaTable> {
  $$ChannelSyncMetaTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get channelId =>
      $composableBuilder(column: $table.channelId, builder: (column) => column);

  GeneratedColumn<DateTime> get lastSyncedAt => $composableBuilder(
      column: $table.lastSyncedAt, builder: (column) => column);

  GeneratedColumn<bool> get hasMore =>
      $composableBuilder(column: $table.hasMore, builder: (column) => column);

  GeneratedColumn<int> get messageCount => $composableBuilder(
      column: $table.messageCount, builder: (column) => column);
}

class $$ChannelSyncMetaTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ChannelSyncMetaTable,
    ChannelSyncMetaEntity,
    $$ChannelSyncMetaTableFilterComposer,
    $$ChannelSyncMetaTableOrderingComposer,
    $$ChannelSyncMetaTableAnnotationComposer,
    $$ChannelSyncMetaTableCreateCompanionBuilder,
    $$ChannelSyncMetaTableUpdateCompanionBuilder,
    (
      ChannelSyncMetaEntity,
      BaseReferences<_$AppDatabase, $ChannelSyncMetaTable,
          ChannelSyncMetaEntity>
    ),
    ChannelSyncMetaEntity,
    PrefetchHooks Function()> {
  $$ChannelSyncMetaTableTableManager(
      _$AppDatabase db, $ChannelSyncMetaTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ChannelSyncMetaTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ChannelSyncMetaTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ChannelSyncMetaTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> channelId = const Value.absent(),
            Value<DateTime> lastSyncedAt = const Value.absent(),
            Value<bool> hasMore = const Value.absent(),
            Value<int> messageCount = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ChannelSyncMetaCompanion(
            channelId: channelId,
            lastSyncedAt: lastSyncedAt,
            hasMore: hasMore,
            messageCount: messageCount,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String channelId,
            required DateTime lastSyncedAt,
            Value<bool> hasMore = const Value.absent(),
            Value<int> messageCount = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ChannelSyncMetaCompanion.insert(
            channelId: channelId,
            lastSyncedAt: lastSyncedAt,
            hasMore: hasMore,
            messageCount: messageCount,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$ChannelSyncMetaTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $ChannelSyncMetaTable,
    ChannelSyncMetaEntity,
    $$ChannelSyncMetaTableFilterComposer,
    $$ChannelSyncMetaTableOrderingComposer,
    $$ChannelSyncMetaTableAnnotationComposer,
    $$ChannelSyncMetaTableCreateCompanionBuilder,
    $$ChannelSyncMetaTableUpdateCompanionBuilder,
    (
      ChannelSyncMetaEntity,
      BaseReferences<_$AppDatabase, $ChannelSyncMetaTable,
          ChannelSyncMetaEntity>
    ),
    ChannelSyncMetaEntity,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedMessagesTableTableManager get cachedMessages =>
      $$CachedMessagesTableTableManager(_db, _db.cachedMessages);
  $$ChannelSyncMetaTableTableManager get channelSyncMeta =>
      $$ChannelSyncMetaTableTableManager(_db, _db.channelSyncMeta);
}
